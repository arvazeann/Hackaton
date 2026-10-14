import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  adminAddressQuerySchema,
  adminAuditLogQuerySchema,
  adminOrderQuerySchema,
  adminProductQuerySchema,
  adminUserQuerySchema,
} from "@/schemas";
import type {
  AdminAddressDTO,
  AdminAuditLogDTO,
  AdminOrderDTO,
  AdminOverviewDTO,
  AdminPage,
  AdminProductDTO,
  AdminUserDTO,
} from "@/types/admin";
import {
  AdminRecordNotFoundError,
  requireAdminActor,
} from "@/server/admin/authorization";

const pageOf = <T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): AdminPage<T> => ({
  items,
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});

export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 1)}•••@${domain}`;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  lastLoginAt: true,
  lastActiveAt: true,
  disabledAt: true,
} satisfies Prisma.UserSelect;

function mapUser(
  row: Prisma.UserGetPayload<{ select: typeof userSelect }>,
): AdminUserDTO {
  const isOnline =
    row.lastActiveAt !== null &&
    row.lastActiveAt.getTime() >= Date.now() - 15 * 60 * 1000;
  return {
    id: row.id,
    name: row.name,
    emailMasked: maskEmail(row.email),
    role: row.role,
    isDisabled: row.disabledAt !== null,
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    lastActiveAt: row.lastActiveAt?.toISOString() ?? null,
    isOnline,
  };
}

export async function getAdminOverview(): Promise<AdminOverviewDTO> {
  await requireAdminActor();
  const now = Date.now();
  const last7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const onlineSince = new Date(now - 15 * 60 * 1000);
  const [
    totalUsers,
    registeredLast7Days,
    registeredLast30Days,
    onlineApproximate,
    activeLast7Days,
    productGroups,
    orderGroups,
    users,
    orders,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: last7 } } }),
    db.user.count({ where: { createdAt: { gte: last30 } } }),
    db.user.count({ where: { lastActiveAt: { gte: onlineSince } } }),
    db.user.count({ where: { lastActiveAt: { gte: last7 } } }),
    db.product.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderCode: true,
        productTitleSnapshot: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);
  const productsByStatus: AdminOverviewDTO["productsByStatus"] = {
    active: 0,
    reserved: 0,
    sold: 0,
    archived: 0,
  };
  for (const group of productGroups)
    productsByStatus[group.status] = group._count._all;
  const ordersByStatus: AdminOverviewDTO["ordersByStatus"] = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
  };
  for (const group of orderGroups)
    ordersByStatus[group.status] = group._count._all;

  return {
    users: {
      total: totalUsers,
      registeredLast7Days,
      registeredLast30Days,
      onlineApproximate,
      activeLast7Days,
    },
    productsByStatus,
    ordersByStatus,
    latestUsers: users.map((user) => ({
      id: user.id,
      name: user.name,
      emailMasked: maskEmail(user.email),
      createdAt: user.createdAt.toISOString(),
    })),
    latestOrders: orders.map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      productTitle: order.productTitleSnapshot,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}

export async function listAdminUsers(
  rawQuery: unknown,
): Promise<AdminPage<AdminUserDTO>> {
  await requireAdminActor();
  const query = adminUserQuerySchema.parse(rawQuery);
  const dateFilter = {
    ...(query.dateFrom
      ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }
      : {}),
    ...(query.dateTo
      ? {
          lt: new Date(
            new Date(`${query.dateTo}T00:00:00.000Z`).getTime() +
              24 * 60 * 60 * 1000,
          ),
        }
      : {}),
  };
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.accountState === "enabled" ? { disabledAt: null } : {}),
    ...(query.accountState === "disabled" ? { disabledAt: { not: null } } : {}),
    ...(query.dateFrom || query.dateTo ? { createdAt: dateFilter } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: userSelect,
    }),
    db.user.count({ where }),
  ]);
  return pageOf(rows.map(mapUser), query.page, query.pageSize, total);
}

export async function listAdminProducts(
  rawQuery: unknown,
): Promise<AdminPage<AdminProductDTO>> {
  await requireAdminActor();
  const query = adminProductQuerySchema.parse(rawQuery);
  const where: Prisma.ProductWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        categoryId: true,
        condition: true,
        city: true,
        status: true,
        createdAt: true,
        category: { select: { name: true } },
        seller: { select: { id: true, name: true } },
        orders: {
          where: { status: { in: ["pending", "confirmed"] } },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.product.count({ where }),
  ]);
  return pageOf(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      price: row.price,
      categoryId: row.categoryId,
      status: row.status,
      condition: row.condition,
      city: row.city,
      hasOpenOrder: row.orders.length > 0,
      category: row.category.name,
      seller: { id: row.seller.id, name: row.seller.name },
      createdAt: row.createdAt.toISOString(),
    })),
    query.page,
    query.pageSize,
    total,
  );
}

export async function getAdminProductCategories() {
  await requireAdminActor();
  return db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listAdminOrders(
  rawQuery: unknown,
): Promise<AdminPage<AdminOrderDTO>> {
  await requireAdminActor();
  const query = adminOrderQuerySchema.parse(rawQuery);
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? { orderCode: { contains: query.q, mode: "insensitive" } }
      : {}),
    ...(query.identityId
      ? {
          OR: [{ buyerId: query.identityId }, { sellerId: query.identityId }],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        orderCode: true,
        productTitleSnapshot: true,
        priceAtOrder: true,
        status: true,
        createdAt: true,
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    }),
    db.order.count({ where }),
  ]);
  return pageOf(
    rows.map((row) => ({
      id: row.id,
      orderCode: row.orderCode,
      productTitle: row.productTitleSnapshot,
      price: row.priceAtOrder,
      status: row.status,
      buyer: { id: row.buyer.id, name: row.buyer.name },
      seller: { id: row.seller.id, name: row.seller.name },
      createdAt: row.createdAt.toISOString(),
    })),
    query.page,
    query.pageSize,
    total,
  );
}

export async function listAdminAddresses(
  rawQuery: unknown,
): Promise<AdminPage<AdminAddressDTO>> {
  await requireAdminActor();
  const query = adminAddressQuerySchema.parse(rawQuery);
  const ownerFilter = query.q
    ? {
        OR: [
          { name: { contains: query.q, mode: "insensitive" as const } },
          { email: { contains: query.q, mode: "insensitive" as const } },
        ],
      }
    : undefined;
  const where: Prisma.AddressWhereInput = {
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.city
      ? { city: { contains: query.city, mode: "insensitive" } }
      : {}),
    ...(query.province
      ? { province: { contains: query.province, mode: "insensitive" } }
      : {}),
    ...(ownerFilter ? { user: { is: ownerFilter } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.address.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        kind: true,
        label: true,
        city: true,
        province: true,
        isDefault: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    db.address.count({ where }),
  ]);
  return pageOf(
    rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      city: row.city,
      province: row.province,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      owner: { id: row.user.id, name: row.user.name },
    })),
    query.page,
    query.pageSize,
    total,
  );
}

export async function revealAdminUserEmail(targetUserId: string) {
  const actor = await requireAdminActor();
  return db.$transaction(async (tx) => {
    const actorRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "users"
      WHERE "id" = ${actor.id} AND "role" = 'ADMIN'::"user_role"
      FOR SHARE
    `;
    if (actorRows.length !== 1)
      throw new Error("Administrator authorization changed.");
    const target = await tx.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true },
    });
    if (!target) throw new AdminRecordNotFoundError();
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "ADMIN_CONTACT_REVEAL",
        targetType: "User",
        targetId: target.id,
      },
      select: { id: true },
    });
    return { email: target.email };
  });
}

function safeAuditMetadata(
  value: Prisma.JsonValue | null,
): AdminAuditLogDTO["metadata"] {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const output: NonNullable<AdminAuditLogDTO["metadata"]> = {};
  for (const key of [
    "changedFields",
    "fromDisabled",
    "toDisabled",
    "fromStatus",
    "toStatus",
  ] as const) {
    const item = value[key];
    if (typeof item === "string" || typeof item === "boolean")
      output[key] = item;
  }
  return output;
}

export async function listAdminAuditLogs(
  rawQuery: unknown,
): Promise<AdminPage<AdminAuditLogDTO>> {
  await requireAdminActor();
  const query = adminAuditLogQuerySchema.parse(rawQuery);
  const where: Prisma.AuditLogWhereInput = {
    ...(query.action ? { action: query.action } : {}),
    ...(query.targetType ? { targetType: query.targetType } : {}),
  };
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        requestId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, name: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);
  return pageOf(
    rows.map((row) => ({
      id: row.id,
      actor: row.actor,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      requestId: row.requestId,
      metadata: safeAuditMetadata(row.metadata),
      createdAt: row.createdAt.toISOString(),
    })),
    query.page,
    query.pageSize,
    total,
  );
}
