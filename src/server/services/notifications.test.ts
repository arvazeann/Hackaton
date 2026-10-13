import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

const prisma = vi.hoisted(() => ({
  notification: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  notificationPreference: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: prisma }));

import {
  createOrderNotification,
  getNotificationPreferences,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationPreferences,
} from "@/server/services/notifications";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const orderId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

beforeEach(() => {
  vi.clearAllMocks();
  prisma.notificationPreference.findUnique.mockResolvedValue(null);
  prisma.notificationPreference.findMany.mockResolvedValue([]);
  prisma.notification.count.mockResolvedValue(0);
  prisma.notification.findMany.mockResolvedValue([]);
  prisma.notification.updateMany.mockResolvedValue({ count: 1 });
  prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
    Promise.all(operations),
  );
});

describe("notification service", () => {
  it("defaults all notification types to enabled and saves a disabled type", async () => {
    const defaults = await getNotificationPreferences(userId);
    expect(defaults).toHaveLength(5);
    expect(defaults.every(({ enabled }) => enabled)).toBe(true);

    const preferences = defaults.map((item) => ({
      ...item,
      enabled: item.type !== "ORDER_PLACED",
    }));
    expect(
      await saveNotificationPreferences(userId, { preferences }),
    ).toMatchObject({ ok: true });
    expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_type: { userId, type: "ORDER_PLACED" } },
        create: { userId, type: "ORDER_PLACED", enabled: false },
      }),
    );
  });

  it("checks the recipient preference in the order transaction and omits disabled notifications", async () => {
    const tx = {
      notificationPreference: {
        findUnique: vi.fn().mockResolvedValue({ enabled: false }),
      },
      notification: { create: vi.fn() },
    };
    await expect(
      createOrderNotification(
        tx as unknown as Prisma.TransactionClient,
        userId,
        orderId,
        "ORDER_PLACED",
      ),
    ).resolves.toBeNull();
    expect(tx.notification.create).not.toHaveBeenCalled();
    expect(tx.notificationPreference.findUnique).toHaveBeenCalledWith({
      where: { userId_type: { userId, type: "ORDER_PLACED" } },
      select: { enabled: true },
    });
  });

  it("creates generic notifications without contact or payment information", async () => {
    const tx = {
      notificationPreference: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      notification: { create: vi.fn().mockResolvedValue({ id: "n1" }) },
    };
    await createOrderNotification(
      tx as unknown as Prisma.TransactionClient,
      userId,
      orderId,
      "ORDER_CONFIRMED",
    );
    const data = tx.notification.create.mock.calls[0][0].data;
    expect(data).toEqual({
      userId,
      orderId,
      type: "ORDER_CONFIRMED",
      title: expect.any(String),
      body: expect.any(String),
    });
    expect(JSON.stringify(data)).not.toMatch(
      /phone|address|payment|rekening|081\d{8,}|@/i,
    );
  });

  it("scopes notification reads and updates to the session owner", async () => {
    await getNotifications(otherUserId);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: otherUserId } }),
    );
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: otherUserId, readAt: null },
    });
    await markNotificationRead(userId, "notification-id");
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notification-id", userId, readAt: null },
      data: { readAt: expect.any(Date) },
    });
    await markAllNotificationsRead(userId);
    expect(prisma.notification.updateMany).toHaveBeenLastCalledWith({
      where: { userId, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});
