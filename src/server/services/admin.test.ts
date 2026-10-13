import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return {
    auth: vi.fn(),
    tx,
    transaction: vi.fn(),
    user: { findUnique: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    product: { groupBy: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    order: { groupBy: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    address: { findMany: vi.fn(), count: vi.fn() },
  };
});

vi.mock("../../../auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    user: mocks.user,
    product: mocks.product,
    order: mocks.order,
    address: mocks.address,
    $transaction: mocks.transaction,
  },
}));

import {
  getAdminOverview,
  listAdminAddresses,
  listAdminOrders,
  listAdminProducts,
  listAdminUsers,
  revealAdminUserEmail,
} from "@/server/services/admin";

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const targetId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const adminCalls = [
  () => getAdminOverview(),
  () => listAdminUsers({}),
  () => listAdminProducts({}),
  () => listAdminOrders({}),
  () => listAdminAddresses({}),
  () => revealAdminUserEmail(targetId),
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: adminId } });
  mocks.user.findUnique.mockResolvedValue({ id: adminId, role: "ADMIN" });
  mocks.user.count.mockResolvedValue(0);
  mocks.user.findMany.mockResolvedValue([]);
  mocks.product.groupBy.mockResolvedValue([]);
  mocks.product.findMany.mockResolvedValue([]);
  mocks.product.count.mockResolvedValue(0);
  mocks.order.groupBy.mockResolvedValue([]);
  mocks.order.findMany.mockResolvedValue([]);
  mocks.order.count.mockResolvedValue(0);
  mocks.address.findMany.mockResolvedValue([]);
  mocks.address.count.mockResolvedValue(0);
  mocks.tx.$queryRaw.mockResolvedValue([{ id: adminId }]);
  mocks.tx.user.findUnique.mockResolvedValue({
    id: targetId,
    email: "ayu.private@example.test",
  });
  mocks.tx.auditLog.create.mockResolvedValue({ id: "audit-1" });
  mocks.transaction.mockImplementation(
    (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
  );
});

describe("admin services", () => {
  it("rejects anonymous calls at every service boundary", async () => {
    mocks.auth.mockResolvedValue(null);
    for (const call of adminCalls)
      await expect(call()).rejects.toMatchObject({ status: 401 });
    expect(mocks.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects USER role at every service boundary", async () => {
    mocks.user.findUnique.mockResolvedValue({ id: adminId, role: "USER" });
    for (const call of adminCalls)
      await expect(call()).rejects.toMatchObject({ status: 403 });
    expect(mocks.product.findMany).not.toHaveBeenCalled();
    expect(mocks.order.findMany).not.toHaveBeenCalled();
    expect(mocks.address.findMany).not.toHaveBeenCalled();
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("returns allowlisted DTOs with masked email and no contacts, addresses, payments, or password hash", async () => {
    const createdAt = new Date("2026-10-01T00:00:00.000Z");
    mocks.user.findMany.mockResolvedValue([
      {
        id: targetId,
        name: "Ayu",
        email: "ayu.private@example.test",
        role: "USER",
        createdAt,
        lastLoginAt: null,
        lastActiveAt: null,
        passwordHash: "NEVER_SELECT_ME",
        phone: "PRIVATE_PHONE_08123456789",
      },
    ]);
    mocks.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        title: "Tas",
        price: 100,
        status: "active",
        createdAt,
        category: { name: "Aksesori" },
        seller: {
          id: targetId,
          name: "Ayu",
          phone: "PRIVATE_PHONE_08123456789",
        },
      },
    ]);
    mocks.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        orderCode: "RL-1",
        productTitleSnapshot: "Tas",
        priceAtOrder: 100,
        status: "pending",
        createdAt,
        buyer: { id: targetId, name: "Ayu", email: "ayu.private@example.test" },
        seller: {
          id: adminId,
          name: "Admin",
          phone: "PRIVATE_PHONE_08123456789",
        },
        shippingPhone: "PRIVATE_PHONE_08123456789",
        shippingAddress: "PRIVATE_STREET_123",
        paymentInstructionCiphertext: "PRIVATE_PAYMENT",
      },
    ]);
    mocks.address.findMany.mockResolvedValue([
      {
        id: "address-1",
        kind: "SHIPPING",
        label: "Rumah",
        city: "Bandung",
        province: "Jawa Barat",
        isDefault: true,
        createdAt,
        user: { id: targetId, name: "Ayu", email: "ayu.private@example.test" },
        phone: "PRIVATE_PHONE_08123456789",
        street: "PRIVATE_STREET_123",
        postalCode: "40123",
        contactName: "PRIVATE_CONTACT",
      },
    ]);

    const [users, products, orders, addresses, overview] = await Promise.all([
      listAdminUsers({}),
      listAdminProducts({}),
      listAdminOrders({}),
      listAdminAddresses({}),
      getAdminOverview(),
    ]);
    const serialized = JSON.stringify({
      users,
      products,
      orders,
      addresses,
      overview,
    });
    expect(users.items[0]).toMatchObject({ emailMasked: "a•••@example.test" });
    expect(serialized).not.toContain("ayu.private@example.test");
    expect(serialized).not.toMatch(
      /passwordHash|NEVER_SELECT_ME|PRIVATE_PHONE|PRIVATE_STREET|PRIVATE_PAYMENT|PRIVATE_CONTACT|postalCode|shippingAddress/i,
    );
    expect(mocks.order.findMany.mock.calls[0][0].select).not.toHaveProperty(
      "shippingPhone",
    );
    expect(mocks.address.findMany.mock.calls[0][0].select).not.toHaveProperty(
      "street",
    );
    expect(mocks.user.findMany.mock.calls[0][0].select).not.toHaveProperty(
      "passwordHash",
    );
  });

  it("uses default pagination, caps accepted size at 48, rejects invalid sizes, and permits empty out-of-range pages", async () => {
    const createdAt = new Date();
    mocks.user.findMany.mockResolvedValue([]);
    mocks.user.count.mockResolvedValue(0);
    await expect(listAdminUsers({})).resolves.toMatchObject({
      page: 1,
      pageSize: 12,
      totalPages: 0,
      items: [],
    });
    await listAdminUsers({ page: 3, pageSize: 48 });
    expect(mocks.user.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 96, take: 48 }),
    );
    const count = mocks.user.findMany.mock.calls.length;
    await expect(listAdminUsers({ pageSize: 49 })).rejects.toThrow();
    await expect(listAdminUsers({ page: 0 })).rejects.toThrow();
    await expect(listAdminUsers({ surprise: "value" })).rejects.toThrow();
    expect(mocks.user.findMany).toHaveBeenCalledTimes(count);
    expect(createdAt).toBeInstanceOf(Date);
  });

  it("audits an explicit email reveal inside the transaction before returning the value", async () => {
    const order: string[] = [];
    mocks.tx.$queryRaw.mockImplementation(async () => {
      order.push("role-lock");
      return [{ id: adminId }];
    });
    mocks.tx.user.findUnique.mockImplementation(async () => {
      order.push("read-email");
      return { id: targetId, email: "ayu.private@example.test" };
    });
    mocks.tx.auditLog.create.mockImplementation(async () => {
      order.push("audit");
      return { id: "audit-1" };
    });
    await expect(revealAdminUserEmail(targetId)).resolves.toEqual({
      email: "ayu.private@example.test",
    });
    expect(order).toEqual(["role-lock", "read-email", "audit"]);
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: adminId,
        action: "ADMIN_CONTACT_REVEAL",
        targetType: "User",
        targetId,
      },
      select: { id: true },
    });
    expect(JSON.stringify(mocks.tx.auditLog.create.mock.calls)).not.toContain(
      "ayu.private@example.test",
    );
  });

  it("fails closed and returns no email when audit insertion fails", async () => {
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    await expect(revealAdminUserEmail(targetId)).rejects.toThrow(
      "audit unavailable",
    );
    expect(mocks.tx.user.findUnique).toHaveBeenCalledWith({
      where: { id: targetId },
      select: { id: true, email: true },
    });
  });

  it("requires the database role lock inside the email reveal transaction", async () => {
    mocks.tx.$queryRaw.mockResolvedValue([]);
    await expect(revealAdminUserEmail(targetId)).rejects.toThrow(
      "authorization changed",
    );
    expect(mocks.tx.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });
});
