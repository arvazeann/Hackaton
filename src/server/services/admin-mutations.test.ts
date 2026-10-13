import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    product: { findUnique: vi.fn(), updateMany: vi.fn() },
    order: { findUnique: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
    notificationPreference: { findUnique: vi.fn() },
    notification: { findFirst: vi.fn(), create: vi.fn() },
  };
  return {
    auth: vi.fn(),
    transaction: vi.fn(),
    user: { findUnique: vi.fn() },
    tx,
    activeAdminRows: [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
  };
});

vi.mock("../../../auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: { user: mocks.user, $transaction: mocks.transaction },
}));

import {
  AdminMutationConflictError,
  archiveAdminProduct,
  cancelAdminPendingOrder,
  setAdminUserAccountState,
  updateAdminProduct,
  updateAdminUserName,
} from "@/server/services/admin-mutations";

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const targetId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const productId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const orderId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const categoryId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.activeAdminRows = [{ id: adminId }, { id: targetId }];
  mocks.auth.mockResolvedValue({ user: { id: adminId } });
  mocks.user.findUnique.mockResolvedValue({
    id: adminId,
    role: "ADMIN",
    disabledAt: null,
  });
  mocks.transaction.mockImplementation(
    (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
  );
  mocks.tx.$queryRaw.mockImplementation(
    async (strings: TemplateStringsArray) => {
      const query = strings.join("");
      if (query.includes("FOR SHARE")) return [{ id: adminId }];
      if (query.includes('"role" =')) return mocks.activeAdminRows;
      if (query.includes('"id" =')) return [{ id: targetId }];
      return [{ id: productId }];
    },
  );
  mocks.tx.user.findUnique.mockResolvedValue({
    id: targetId,
    name: "Old Name",
    role: "USER",
    disabledAt: null,
  });
  mocks.tx.user.updateMany.mockResolvedValue({ count: 1 });
  mocks.tx.product.findUnique.mockResolvedValue({
    id: productId,
    status: "active",
    title: "Tas",
    description: "Deskripsi",
    price: 100000,
    categoryId,
    condition: "good",
    city: "Bandung",
  });
  mocks.tx.product.findUnique.mockImplementation(
    async ({ select }: { select?: { category?: unknown } }) => {
      if (select?.category) {
        return {
          id: productId,
          title: "Tas Baru",
          description: "Deskripsi",
          price: 120000,
          categoryId,
          status: "active",
          condition: "good",
          city: "Bandung",
          createdAt: new Date("2026-10-01T00:00:00.000Z"),
          category: { name: "Aksesori" },
          seller: { id: targetId, name: "Ayu" },
        };
      }
      return {
        id: productId,
        status: "active",
        title: "Tas",
        description: "Deskripsi",
        price: 100000,
        categoryId,
        condition: "good",
        city: "Bandung",
      };
    },
  );
  mocks.tx.product.updateMany.mockResolvedValue({ count: 1 });
  mocks.tx.order.findFirst.mockResolvedValue(null);
  mocks.tx.order.findUnique.mockResolvedValue({
    id: orderId,
    status: "pending",
    productId,
    buyerId: targetId,
    sellerId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  });
  mocks.tx.order.updateMany.mockResolvedValue({ count: 1 });
  mocks.tx.auditLog.create.mockResolvedValue({ id: "audit-1" });
  mocks.tx.notificationPreference.findUnique.mockResolvedValue(null);
  mocks.tx.notification.findFirst.mockResolvedValue(null);
  mocks.tx.notification.create.mockResolvedValue({ id: "notification-1" });
});

describe("Admin Phase 2 mutation services", () => {
  it("requires a current ADMIN at each mutation service boundary", async () => {
    const calls = [
      () => updateAdminUserName(targetId, { name: "New Name" }),
      () => setAdminUserAccountState(targetId, { action: "disable" }),
      () =>
        updateAdminProduct(productId, {
          title: "Tas Baru",
          description: "Deskripsi",
          price: 120000,
          categoryId,
          condition: "good",
          city: "Bandung",
        }),
      () => archiveAdminProduct(productId),
      () =>
        cancelAdminPendingOrder(orderId, { reason: "Pelanggaran kebijakan" }),
    ];
    mocks.auth.mockResolvedValue(null);
    for (const call of calls)
      await expect(call()).rejects.toMatchObject({ status: 401 });
    mocks.auth.mockResolvedValue({ user: { id: adminId } });
    mocks.user.findUnique.mockResolvedValue({
      id: adminId,
      role: "USER",
      disabledAt: null,
    });
    for (const call of calls)
      await expect(call()).rejects.toMatchObject({ status: 403 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("changes only the user name and writes safe audit metadata in the transaction", async () => {
    await expect(
      updateAdminUserName(targetId, { name: "New Name" }),
    ).resolves.toEqual({
      changed: true,
    });
    expect(mocks.tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: targetId, name: "Old Name" },
      data: { name: "New Name" },
    });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: adminId,
        action: "ADMIN_USER_NAME_UPDATE",
        targetType: "User",
        targetId,
        metadata: { changedFields: "name" },
      }),
      select: { id: true },
    });
  });

  it("rejects invalid name fields and never accepts role/password updates", async () => {
    await expect(
      updateAdminUserName(targetId, { name: "x" }),
    ).rejects.toThrow();
    await expect(
      updateAdminUserName(targetId, { name: "Valid Name", role: "ADMIN" }),
    ).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("disables an account atomically, increments the token version and audits only state", async () => {
    await expect(
      setAdminUserAccountState(targetId, { action: "disable" }),
    ).resolves.toEqual({ changed: true, isDisabled: true });
    expect(mocks.tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: targetId, disabledAt: null },
      data: {
        disabledAt: expect.any(Date),
        sessionVersion: { increment: 1 },
      },
    });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ADMIN_USER_DISABLE",
        metadata: { fromDisabled: false, toDisabled: true },
      }),
      select: { id: true },
    });
  });

  it("rejects self-disable and disabling the last active administrator", async () => {
    await expect(
      setAdminUserAccountState(adminId, { action: "disable" }),
    ).rejects.toThrow("akunnya sendiri");
    mocks.tx.user.findUnique.mockResolvedValue({
      id: targetId,
      role: "ADMIN",
      disabledAt: null,
    });
    mocks.activeAdminRows = [{ id: adminId }];
    await expect(
      setAdminUserAccountState(targetId, { action: "disable" }),
    ).rejects.toThrow("terakhir");
    expect(mocks.tx.user.updateMany).not.toHaveBeenCalled();
  });

  it("re-enables without decrementing the token version and fails on a lost race", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({
      id: targetId,
      disabledAt: new Date(),
    });
    await setAdminUserAccountState(targetId, { action: "enable" });
    expect(mocks.tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: targetId, disabledAt: { not: null } },
      data: { disabledAt: null },
    });
    expect(mocks.tx.user.updateMany.mock.calls[0][0].data).not.toHaveProperty(
      "sessionVersion",
    );
    mocks.tx.user.findUnique.mockResolvedValue({
      id: targetId,
      disabledAt: new Date(),
    });
    mocks.tx.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      setAdminUserAccountState(targetId, { action: "enable" }),
    ).rejects.toBeInstanceOf(AdminMutationConflictError);
  });

  it("edits only active products with no open order and preserves image/order data", async () => {
    const input = {
      title: "Tas Baru",
      description: "Deskripsi baru",
      price: 120000,
      categoryId,
      condition: "good",
      city: "Bandung",
    };
    await updateAdminProduct(productId, input);
    expect(mocks.tx.$queryRaw).toHaveBeenCalled();
    expect(mocks.tx.order.findFirst).toHaveBeenCalledWith({
      where: { productId, status: { in: ["pending", "confirmed"] } },
      select: { id: true },
    });
    expect(mocks.tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: productId, status: "active" },
      data: input,
    });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "ADMIN_PRODUCT_UPDATE" }),
      }),
    );
  });

  it("rejects edits and archive when an order is open or the product is not active", async () => {
    mocks.tx.order.findFirst.mockResolvedValue({ id: orderId });
    await expect(
      updateAdminProduct(productId, {
        title: "Tas Baru",
        description: "Deskripsi",
        price: 120000,
        categoryId,
        condition: "good",
        city: "Bandung",
      }),
    ).rejects.toThrow("pesanan terbuka");
    expect(mocks.tx.product.updateMany).not.toHaveBeenCalled();
    mocks.tx.order.findFirst.mockResolvedValue(null);
    mocks.tx.product.findUnique.mockResolvedValue({
      id: productId,
      status: "sold",
    });
    await expect(archiveAdminProduct(productId)).rejects.toThrow("aktif");
  });

  it("archives by compare-and-set and rejects a concurrent status change", async () => {
    await expect(archiveAdminProduct(productId)).resolves.toEqual({
      changed: true,
      status: "archived",
    });
    expect(mocks.tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: productId, status: "active" },
      data: { status: "archived" },
    });
    mocks.tx.product.updateMany.mockResolvedValue({ count: 0 });
    await expect(archiveAdminProduct(productId)).rejects.toBeInstanceOf(
      AdminMutationConflictError,
    );
  });

  it("cancels only pending orders, leaves product status alone, audits, then notifies both parties", async () => {
    await expect(
      cancelAdminPendingOrder(orderId, { reason: "Pelanggaran kebijakan" }),
    ).resolves.toMatchObject({
      cancelled: true,
      notifications: { buyer: "sent", seller: "sent" },
    });
    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: orderId, status: "pending" },
      data: { status: "cancelled", cancelReason: "Pelanggaran kebijakan" },
    });
    expect(mocks.tx.product.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "ADMIN_ORDER_CANCEL",
          metadata: { fromStatus: "pending", toStatus: "cancelled" },
        }),
      }),
    );
    expect(mocks.tx.notification.create).toHaveBeenCalledTimes(2);
  });

  it("rejects non-pending orders and invalid cancellation reasons", async () => {
    await expect(
      cancelAdminPendingOrder(orderId, { reason: "bad" }),
    ).rejects.toThrow();
    mocks.tx.order.findUnique.mockResolvedValue({
      id: orderId,
      status: "confirmed",
      productId,
      buyerId: targetId,
      sellerId: adminId,
    });
    await expect(
      cancelAdminPendingOrder(orderId, { reason: "Valid required reason" }),
    ).rejects.toThrow("pending");
    expect(mocks.tx.order.updateMany).not.toHaveBeenCalled();
  });

  it("rolls back a mutation when audit insertion fails", async () => {
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    await expect(
      updateAdminUserName(targetId, { name: "New Name" }),
    ).rejects.toThrow("audit unavailable");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.user.updateMany).toHaveBeenCalledTimes(1);
  });

  it("does not undo committed cancellation when notification delivery keeps failing", async () => {
    mocks.tx.notification.create.mockRejectedValue(
      new Error("delivery failure"),
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      cancelAdminPendingOrder(orderId, { reason: "Pelanggaran kebijakan" }),
    ).resolves.toMatchObject({
      cancelled: true,
      notifications: { buyer: "failed", seller: "failed" },
    });
    expect(mocks.tx.order.updateMany).toHaveBeenCalledTimes(1);
    expect(mocks.tx.notification.create).toHaveBeenCalledTimes(6);
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });
});
