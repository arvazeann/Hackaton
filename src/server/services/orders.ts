import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  cancelReasonSchema,
  createOrderSchema,
  orderStatusSchema,
} from "@/schemas";
import type { ActionResult, ErrorCode, OrderDTO } from "@/types";
import {
  decryptPaymentData,
  encryptPaymentData,
} from "@/server/security/payment-encryption";
import { createOrderNotification } from "@/server/services/notifications";

type OrderRecord = Prisma.OrderGetPayload<Prisma.OrderDefaultArgs>;
type OrderAction = "confirm" | "reject" | "cancel" | "complete";
type ViewerRole = "buyer" | "seller";

const fail = <T = never>(
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> => ({
  success: false,
  error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) },
});
const ok = <T>(data: T): ActionResult<T> => ({ success: true, data });
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

function mapOrder(order: OrderRecord, viewer: ViewerRole): OrderDTO {
  const showSellerContacts =
    viewer === "buyer" ||
    order.status === "confirmed" ||
    order.status === "completed";
  const paymentVisible =
    order.status === "confirmed" || order.status === "completed";
  let paymentInstruction: OrderDTO["paymentInstruction"] = null;
  if (paymentVisible && order.paymentInstructionCiphertext) {
    try {
      paymentInstruction = JSON.parse(
        decryptPaymentData(order.paymentInstructionCiphertext),
      ) as OrderDTO["paymentInstruction"];
    } catch {
      paymentInstruction = null;
    }
  }
  return {
    id: order.id,
    orderCode: order.orderCode,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    productId: order.productId,
    productTitleSnapshot: order.productTitleSnapshot,
    priceAtOrder: order.priceAtOrder,
    status: order.status,
    shippingName: order.shippingName,
    shippingPhone: showSellerContacts ? order.shippingPhone : null,
    shippingAddress: showSellerContacts ? order.shippingAddress : null,
    note: order.note,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paymentInstruction:
      viewer === "buyer" || viewer === "seller" ? paymentInstruction : null,
    paymentAccountNumberLast4: paymentVisible
      ? order.paymentAccountNumberLast4
      : null,
  };
}

function prismaCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error)
    return typeof error.code === "string" ? error.code : undefined;
  return undefined;
}

class ConcurrentOrderChange extends Error {}

export async function createOrder(
  input: unknown,
  buyerId: string | null,
): Promise<ActionResult<OrderDTO>> {
  if (!buyerId || !isUuid(buyerId))
    return fail("UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success)
    return fail(
      "VALIDATION_ERROR",
      "Periksa kembali data pesanan.",
      parsed.error.flatten().fieldErrors,
    );

  try {
    return await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: parsed.data.productId },
      });
      if (!product) return fail("NOT_FOUND", "Produk tidak ditemukan.");
      if (product.sellerId === buyerId)
        return fail(
          "FORBIDDEN",
          "Kamu tidak bisa memesan produk milik sendiri.",
        );
      if (product.status !== "active")
        return fail("PRODUCT_NOT_AVAILABLE", "Produk sudah tidak tersedia.");
      const sellerStore = await tx.sellerProfile.findUnique({
        where: { userId: product.sellerId },
        select: { isOnVacation: true },
      });
      if (sellerStore?.isOnVacation)
        return fail(
          "PRODUCT_NOT_AVAILABLE",
          "Toko sedang libur dan belum menerima pesanan baru.",
        );

      const openOrder = await tx.order.findFirst({
        where: {
          productId: product.id,
          status: { in: ["pending", "confirmed"] },
        },
        select: { id: true },
      });
      if (openOrder)
        return fail("CONFLICT", "Produk sudah memiliki pesanan terbuka.");

      const record = await tx.order.create({
        data: {
          orderCode: `RL-${crypto.randomUUID().replaceAll("-", "").slice(0, 21).toUpperCase()}`,
          buyerId,
          sellerId: product.sellerId,
          productId: product.id,
          priceAtOrder: product.price,
          productTitleSnapshot: product.title,
          status: "pending",
          shippingName: parsed.data.shippingName,
          shippingPhone: parsed.data.shippingPhone,
          shippingAddress: parsed.data.shippingAddress,
          note: parsed.data.note?.trim() || null,
        },
      });
      await createOrderNotification(
        tx,
        record.sellerId,
        record.id,
        "ORDER_PLACED",
      );
      return ok(mapOrder(record, "buyer"));
    });
  } catch (error) {
    if (prismaCode(error) === "P2002")
      return fail("CONFLICT", "Produk sudah memiliki pesanan terbuka.");
    if (prismaCode(error) === "P2003")
      return fail("UNAUTHENTICATED", "Akun tidak lagi tersedia.");
    return fail("INTERNAL_ERROR", "Pesanan gagal dibuat.");
  }
}

export async function getOrders(userId: string): Promise<{
  purchases: OrderDTO[];
  sales: OrderDTO[];
}> {
  if (!isUuid(userId)) return { purchases: [], sales: [] };
  const [purchases, sales] = await Promise.all([
    db.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    purchases: purchases.map((order) => mapOrder(order, "buyer")),
    sales: sales.map((order) => mapOrder(order, "seller")),
  };
}

export async function getOrder(
  id: string,
  viewerId: string,
): Promise<OrderDTO | null> {
  if (!isUuid(id) || !isUuid(viewerId)) return null;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return null;
  if (order.buyerId === viewerId) return mapOrder(order, "buyer");
  if (order.sellerId === viewerId) return mapOrder(order, "seller");
  return null;
}

function nextStatus(
  status: OrderRecord["status"],
  action: OrderAction,
  role: ViewerRole,
): OrderRecord["status"] | null {
  if (status === "pending" && role === "seller" && action === "confirm")
    return "confirmed";
  if (status === "pending" && role === "seller" && action === "reject")
    return "rejected";
  if (status === "pending" && role === "buyer" && action === "cancel")
    return "cancelled";
  if (status === "confirmed" && role === "seller" && action === "complete")
    return "completed";
  if (
    status === "confirmed" &&
    (role === "buyer" || role === "seller") &&
    action === "cancel"
  )
    return "cancelled";
  return null;
}

export async function updateOrderStatus(
  input: unknown,
  actorId: string | null,
): Promise<ActionResult<OrderDTO>> {
  if (!actorId || !isUuid(actorId))
    return fail("UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success)
    return fail(
      "VALIDATION_ERROR",
      "Periksa kembali aksi pesanan.",
      parsed.error.flatten().fieldErrors,
    );

  let cancelReason: string | null = null;
  if (parsed.data.action === "cancel") {
    const reason = cancelReasonSchema.safeParse({ reason: parsed.data.reason });
    if (!reason.success)
      return fail(
        "VALIDATION_ERROR",
        "Alasan pembatalan wajib 5–500 karakter.",
        reason.error.flatten().fieldErrors,
      );
    cancelReason = reason.data.reason;
  }

  try {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: parsed.data.orderId },
      });
      if (!order) return fail("NOT_FOUND", "Pesanan tidak ditemukan.");
      const role: ViewerRole | null =
        order.buyerId === actorId
          ? "buyer"
          : order.sellerId === actorId
            ? "seller"
            : null;
      if (!role)
        return fail("FORBIDDEN", "Kamu tidak memiliki akses ke pesanan ini.");

      const status = nextStatus(order.status, parsed.data.action, role);
      if (!status)
        return fail(
          "INVALID_STATUS_TRANSITION",
          "Aksi tidak tersedia untuk status pesanan ini.",
        );

      let paymentSnapshot: { ciphertext: string; last4: string } | null = null;
      if (parsed.data.action === "confirm") {
        if (!parsed.data.paymentAccountId)
          return fail(
            "VALIDATION_ERROR",
            "Pilih akun pembayaran aktif milik toko.",
          );
        const paymentAccount = await tx.paymentAccount.findFirst({
          where: {
            id: parsed.data.paymentAccountId,
            sellerProfileId: order.sellerId,
            isActive: true,
          },
        });
        if (!paymentAccount)
          return fail(
            "VALIDATION_ERROR",
            "Pilih akun pembayaran aktif milik toko.",
          );
        paymentSnapshot = {
          ciphertext: encryptPaymentData(
            JSON.stringify({
              providerName: paymentAccount.providerName,
              accountHolderName: paymentAccount.accountHolderName,
              accountNumber: decryptPaymentData(
                paymentAccount.accountNumberCiphertext,
              ),
            }),
          ),
          last4: paymentAccount.accountNumberLast4,
        };
      }

      let productTransition:
        | {
            current: "active" | "reserved";
            next: "reserved" | "active" | "sold";
          }
        | undefined;
      if (parsed.data.action === "confirm")
        productTransition = { current: "active", next: "reserved" };
      else if (parsed.data.action === "complete")
        productTransition = { current: "reserved", next: "sold" };
      else if (parsed.data.action === "cancel" && order.status === "confirmed")
        productTransition = { current: "reserved", next: "active" };

      if (productTransition) {
        const changedProduct = await tx.product.updateMany({
          where: { id: order.productId, status: productTransition.current },
          data: { status: productTransition.next },
        });
        if (changedProduct.count !== 1) throw new ConcurrentOrderChange();
      }

      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: order.status,
          ...(role === "buyer" ? { buyerId: actorId } : { sellerId: actorId }),
        },
        data: {
          status,
          ...(cancelReason ? { cancelReason } : {}),
          ...(paymentSnapshot
            ? {
                paymentInstructionCiphertext: paymentSnapshot.ciphertext,
                paymentAccountNumberLast4: paymentSnapshot.last4,
              }
            : {}),
        },
      });
      if (updated.count !== 1) throw new ConcurrentOrderChange();
      const updatedOrder = await tx.order.findUnique({
        where: { id: order.id },
      });
      if (!updatedOrder) throw new ConcurrentOrderChange();
      const notificationType = {
        confirm: "ORDER_CONFIRMED",
        reject: "ORDER_REJECTED",
        cancel: "ORDER_CANCELLED",
        complete: "ORDER_COMPLETED",
      } as const;
      await createOrderNotification(
        tx,
        role === "buyer" ? order.sellerId : order.buyerId,
        order.id,
        notificationType[parsed.data.action],
      );
      return ok(mapOrder(updatedOrder, role));
    });
  } catch (error) {
    if (error instanceof ConcurrentOrderChange || prismaCode(error) === "P2034")
      return fail(
        "CONFLICT",
        "Pesanan telah berubah. Muat ulang lalu coba lagi.",
      );
    return fail("INTERNAL_ERROR", "Pesanan gagal diperbarui.");
  }
}
