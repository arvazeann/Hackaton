import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  notificationDtoSchema,
  notificationPreferenceSchema,
  notificationQuerySchema,
} from "@/schemas";
import type { NotificationType } from "@/types";

export const notificationTypes: NotificationType[] = [
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "ORDER_REJECTED",
  "ORDER_CANCELLED",
  "ORDER_COMPLETED",
];

const copy: Record<NotificationType, { title: string; body: string }> = {
  ORDER_PLACED: { title: "Pesanan baru", body: "Kamu menerima pesanan baru." },
  ORDER_CONFIRMED: {
    title: "Pesanan dikonfirmasi",
    body: "Penjual telah mengonfirmasi pesananmu.",
  },
  ORDER_REJECTED: {
    title: "Pesanan ditolak",
    body: "Penjual tidak dapat menerima pesanan ini.",
  },
  ORDER_CANCELLED: {
    title: "Pesanan dibatalkan",
    body: "Pesanan ini telah dibatalkan.",
  },
  ORDER_COMPLETED: {
    title: "Pesanan selesai",
    body: "Pesanan ini telah selesai.",
  },
};

export async function createOrderNotification(
  tx: Prisma.TransactionClient,
  userId: string,
  orderId: string,
  type: NotificationType,
) {
  const preference = await tx.notificationPreference.findUnique({
    where: { userId_type: { userId, type } },
    select: { enabled: true },
  });
  if (preference?.enabled === false) return null;
  return tx.notification.create({
    data: { userId, orderId, type, ...copy[type] },
  });
}

export async function getNotifications(userId: string, input: unknown = {}) {
  const query = notificationQuerySchema.parse(input);
  const where = { userId };
  const [records, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        type: true,
        orderId: true,
        title: true,
        body: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where }),
    getUnreadNotificationCount(userId),
  ]);
  return {
    items: records.map((item) =>
      notificationDtoSchema.parse({
        ...item,
        readAt: item.readAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      }),
    ),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
    unreadCount,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(userId: string, id: string) {
  const result = await db.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function markAllNotificationsRead(userId: string) {
  const result = await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function getNotificationPreferences(userId: string) {
  const rows = await db.notificationPreference.findMany({ where: { userId } });
  const configured = new Map(rows.map((row) => [row.type, row.enabled]));
  return notificationTypes.map((type) => ({
    type,
    enabled: configured.get(type) ?? true,
  }));
}

export async function saveNotificationPreferences(
  userId: string,
  input: unknown,
) {
  const parsed = notificationPreferenceSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, message: "Preferensi tidak valid." };
  const values = parsed.data.preferences;
  if (
    new Set(values.map((value) => value.type)).size !== notificationTypes.length
  )
    return { ok: false as const, message: "Pilih setiap jenis notifikasi." };
  await db.$transaction(
    values.map(({ type, enabled }) =>
      db.notificationPreference.upsert({
        where: { userId_type: { userId, type } },
        create: { userId, type, enabled },
        update: { enabled },
      }),
    ),
  );
  return { ok: true as const, data: getNotificationPreferences(userId) };
}
