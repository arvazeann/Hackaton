import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  adminOrderCancelSchema,
  adminProductUpdateSchema,
  adminUserAccountStateSchema,
  adminUserNameUpdateSchema,
} from "@/schemas";
import {
  AdminAuthorizationError,
  AdminRecordNotFoundError,
  requireAdminActor,
} from "@/server/admin/authorization";
import { createOrderNotification } from "@/server/services/notifications";

export class AdminMutationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminMutationConflictError";
  }
}

function validId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

async function lockActiveAdmin(tx: Prisma.TransactionClient, actorId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "users"
    WHERE "id" = ${actorId}
      AND "role" = 'ADMIN'::"user_role"
      AND "disabled_at" IS NULL
    FOR SHARE
  `;
  if (rows.length !== 1) throw new AdminAuthorizationError(403);
}

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  targetType: "User" | "Product" | "Order",
  targetId: string,
  metadata: Prisma.InputJsonObject,
) {
  await tx.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata },
    select: { id: true },
  });
}

export async function updateAdminUserName(targetId: string, input: unknown) {
  const actor = await requireAdminActor();
  if (!validId(targetId)) throw new AdminRecordNotFoundError();
  const parsed = adminUserNameUpdateSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lockActiveAdmin(tx, actor.id);
    const target = await tx.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true },
    });
    if (!target) throw new AdminRecordNotFoundError();
    if (target.name === parsed.name) return { changed: false };
    const updated = await tx.user.updateMany({
      where: { id: target.id, name: target.name },
      data: { name: parsed.name },
    });
    if (updated.count !== 1)
      throw new AdminMutationConflictError(
        "Akun berubah bersamaan. Muat ulang lalu coba lagi.",
      );
    await audit(tx, actor.id, "ADMIN_USER_NAME_UPDATE", "User", target.id, {
      changedFields: "name",
    });
    return { changed: true };
  });
}

export async function setAdminUserAccountState(
  targetId: string,
  input: unknown,
) {
  const actor = await requireAdminActor();
  if (!validId(targetId)) throw new AdminRecordNotFoundError();
  const { action } = adminUserAccountStateSchema.parse(input);
  if (action === "disable" && targetId === actor.id)
    throw new AdminMutationConflictError(
      "Admin tidak dapat menonaktifkan akunnya sendiri.",
    );

  return db.$transaction(async (tx) => {
    if (action === "disable") {
      const activeAdmins = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users"
        WHERE "role" = 'ADMIN'::"user_role" AND "disabled_at" IS NULL
        ORDER BY "id" FOR UPDATE
      `;
      if (!activeAdmins.some((admin) => admin.id === actor.id))
        throw new AdminAuthorizationError(403);
      const targetRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users" WHERE "id" = ${targetId} FOR UPDATE
      `;
      if (targetRows.length !== 1) throw new AdminRecordNotFoundError();
      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: { id: true, role: true, disabledAt: true },
      });
      if (!target) throw new AdminRecordNotFoundError();
      if (target.disabledAt) return { changed: false, isDisabled: true };
      if (target.role === "ADMIN" && activeAdmins.length <= 1)
        throw new AdminMutationConflictError(
          "Admin aktif terakhir tidak dapat dinonaktifkan.",
        );
      const changed = await tx.user.updateMany({
        where: { id: target.id, disabledAt: null },
        data: { disabledAt: new Date(), sessionVersion: { increment: 1 } },
      });
      if (changed.count !== 1)
        throw new AdminMutationConflictError(
          "Status akun berubah bersamaan. Muat ulang lalu coba lagi.",
        );
      await audit(tx, actor.id, "ADMIN_USER_DISABLE", "User", target.id, {
        fromDisabled: false,
        toDisabled: true,
      });
      return { changed: true, isDisabled: true };
    }

    await lockActiveAdmin(tx, actor.id);
    const targetRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "users" WHERE "id" = ${targetId} FOR UPDATE
    `;
    if (targetRows.length !== 1) throw new AdminRecordNotFoundError();
    const target = await tx.user.findUnique({
      where: { id: targetId },
      select: { id: true, disabledAt: true },
    });
    if (!target) throw new AdminRecordNotFoundError();
    if (!target.disabledAt) return { changed: false, isDisabled: false };
    const changed = await tx.user.updateMany({
      where: { id: target.id, disabledAt: { not: null } },
      data: { disabledAt: null },
    });
    if (changed.count !== 1)
      throw new AdminMutationConflictError(
        "Status akun berubah bersamaan. Muat ulang lalu coba lagi.",
      );
    await audit(tx, actor.id, "ADMIN_USER_ENABLE", "User", target.id, {
      fromDisabled: true,
      toDisabled: false,
    });
    return { changed: true, isDisabled: false };
  });
}

async function lockProduct(tx: Prisma.TransactionClient, productId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "products" WHERE "id" = ${productId} FOR UPDATE
  `;
  if (rows.length !== 1) throw new AdminRecordNotFoundError();
}

async function ensureNoOpenOrder(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  const openOrder = await tx.order.findFirst({
    where: { productId, status: { in: ["pending", "confirmed"] } },
    select: { id: true },
  });
  if (openOrder)
    throw new AdminMutationConflictError(
      "Produk memiliki pesanan terbuka dan tidak dapat diubah.",
    );
}

const adminProductSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  categoryId: true,
  status: true,
  condition: true,
  city: true,
  createdAt: true,
  category: { select: { name: true } },
  seller: { select: { id: true, name: true } },
} satisfies Prisma.ProductSelect;

export async function updateAdminProduct(id: string, input: unknown) {
  const actor = await requireAdminActor();
  if (!validId(id)) throw new AdminRecordNotFoundError();
  const parsed = adminProductUpdateSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lockActiveAdmin(tx, actor.id);
    await lockProduct(tx, id);
    const product = await tx.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        categoryId: true,
        condition: true,
        city: true,
        status: true,
      },
    });
    if (!product) throw new AdminRecordNotFoundError();
    if (product.status !== "active")
      throw new AdminMutationConflictError(
        "Hanya produk aktif yang dapat diedit.",
      );
    await ensureNoOpenOrder(tx, id);
    const changedFields = (
      Object.keys(parsed) as Array<keyof typeof parsed>
    ).filter((field) => product[field] !== parsed[field]);
    if (changedFields.length === 0) return { changed: false };
    const updated = await tx.product.updateMany({
      where: { id, status: "active" },
      data: parsed,
    });
    if (updated.count !== 1)
      throw new AdminMutationConflictError(
        "Status produk berubah bersamaan. Muat ulang lalu coba lagi.",
      );
    await audit(tx, actor.id, "ADMIN_PRODUCT_UPDATE", "Product", id, {
      changedFields: changedFields.join(","),
    });
    const row = await tx.product.findUnique({
      where: { id },
      select: adminProductSelect,
    });
    if (!row) throw new AdminRecordNotFoundError();
    return {
      changed: true,
      product: {
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        categoryId: row.categoryId,
        status: row.status,
        condition: row.condition,
        city: row.city,
        hasOpenOrder: false,
        category: row.category.name,
        seller: row.seller,
        createdAt: row.createdAt.toISOString(),
      },
    };
  });
}

export async function archiveAdminProduct(id: string) {
  const actor = await requireAdminActor();
  if (!validId(id)) throw new AdminRecordNotFoundError();
  return db.$transaction(async (tx) => {
    await lockActiveAdmin(tx, actor.id);
    await lockProduct(tx, id);
    const product = await tx.product.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!product) throw new AdminRecordNotFoundError();
    if (product.status !== "active")
      throw new AdminMutationConflictError(
        "Hanya produk aktif yang dapat diarsipkan.",
      );
    await ensureNoOpenOrder(tx, id);
    const updated = await tx.product.updateMany({
      where: { id, status: "active" },
      data: { status: "archived" },
    });
    if (updated.count !== 1)
      throw new AdminMutationConflictError(
        "Status produk berubah bersamaan. Muat ulang lalu coba lagi.",
      );
    await audit(tx, actor.id, "ADMIN_PRODUCT_ARCHIVE", "Product", id, {
      fromStatus: "active",
      toStatus: "archived",
    });
    return { changed: true, status: "archived" as const };
  });
}

type AdminCancelCommit = {
  orderId: string;
  buyerId: string;
  sellerId: string;
};

async function deliverCancellationNotification(
  userId: string,
  orderId: string,
) {
  return db.$transaction(async (tx) => {
    const preference = await tx.notificationPreference.findUnique({
      where: { userId_type: { userId, type: "ORDER_CANCELLED" } },
      select: { enabled: true },
    });
    if (preference?.enabled === false) return "disabled" as const;
    const existing = await tx.notification.findFirst({
      where: { userId, orderId, type: "ORDER_CANCELLED" },
      select: { id: true },
    });
    if (existing) return "sent" as const;
    await createOrderNotification(tx, userId, orderId, "ORDER_CANCELLED");
    return "sent" as const;
  });
}

async function notifyCancellation(commit: AdminCancelCommit) {
  const recipients = [commit.buyerId, commit.sellerId];
  const results = await Promise.all(
    recipients.map(async (userId) => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          return await deliverCancellationNotification(userId, commit.orderId);
        } catch {
          if (attempt === 2) {
            console.error(
              "Admin order cancellation committed; notification delivery failed after retries.",
            );
            return "failed" as const;
          }
        }
      }
      return "failed" as const;
    }),
  );
  return { buyer: results[0], seller: results[1] };
}

export async function cancelAdminPendingOrder(id: string, input: unknown) {
  const actor = await requireAdminActor();
  if (!validId(id)) throw new AdminRecordNotFoundError();
  const { reason } = adminOrderCancelSchema.parse(input);
  const committed = await db.$transaction(
    async (tx): Promise<AdminCancelCommit> => {
      await lockActiveAdmin(tx, actor.id);
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "orders" WHERE "id" = ${id} FOR UPDATE
    `;
      if (locked.length !== 1) throw new AdminRecordNotFoundError();
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          productId: true,
          buyerId: true,
          sellerId: true,
        },
      });
      if (!order) throw new AdminRecordNotFoundError();
      if (order.status !== "pending")
        throw new AdminMutationConflictError(
          "Admin hanya dapat membatalkan pesanan pending.",
        );
      const product = await tx.product.findUnique({
        where: { id: order.productId },
        select: { status: true },
      });
      if (product?.status !== "active")
        throw new AdminMutationConflictError(
          "Status produk tidak sesuai untuk pembatalan pesanan pending.",
        );
      const updated = await tx.order.updateMany({
        where: { id, status: "pending" },
        data: { status: "cancelled", cancelReason: reason },
      });
      if (updated.count !== 1)
        throw new AdminMutationConflictError(
          "Pesanan berubah bersamaan. Muat ulang lalu coba lagi.",
        );
      await audit(tx, actor.id, "ADMIN_ORDER_CANCEL", "Order", id, {
        fromStatus: "pending",
        toStatus: "cancelled",
      });
      return {
        orderId: order.id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
      };
    },
  );

  const notifications = await notifyCancellation(committed);
  return { cancelled: true, notifications };
}
