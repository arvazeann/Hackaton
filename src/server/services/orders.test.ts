import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  order: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  product: { findUnique: vi.fn(), updateMany: vi.fn() },
  paymentAccount: { findFirst: vi.fn() },
  sellerProfile: { findUnique: vi.fn() },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}));
const notification = vi.hoisted(() => ({ createOrderNotification: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: prisma }));
vi.mock("@/server/security/payment-encryption", () => ({
  encryptPaymentData: (value: string) => `cipher:${value}`,
  decryptPaymentData: (value: string) =>
    value.startsWith("cipher:") ? value.slice(7) : "123456789012",
}));
vi.mock("@/server/services/notifications", () => notification);

import {
  createOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
} from "@/server/services/orders";
import type { OrderStatus } from "@/types";

const ids = {
  order: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  product: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  buyer: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  seller: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  other: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
};
type TestStatus = OrderStatus;
type TestOrder = {
  id: string;
  orderCode: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  priceAtOrder: number;
  productTitleSnapshot: string;
  status: TestStatus;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note: string | null;
  cancelReason: string | null;
  paymentInstructionCiphertext: string | null;
  paymentAccountNumberLast4: string | null;
  createdAt: Date;
  updatedAt: Date;
};
type TestProduct = {
  id: string;
  sellerId: string;
  title: string;
  price: number;
  status: "active" | "reserved" | "sold" | "archived";
};

let state: { order: TestOrder | null; product: TestProduct };
const freshOrder = (status: TestStatus = "pending"): TestOrder => ({
  id: ids.order,
  orderCode: "RL-TEST-00000000000000000000",
  buyerId: ids.buyer,
  sellerId: ids.seller,
  productId: ids.product,
  priceAtOrder: 150000,
  productTitleSnapshot: "Kamera analog",
  status,
  shippingName: "Raka Pratama",
  shippingPhone: "081234567890",
  shippingAddress: "Jl. Merdeka 10, Bandung",
  note: null,
  cancelReason: null,
  paymentInstructionCiphertext: null,
  paymentAccountNumberLast4: null,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
});

beforeEach(() => {
  vi.clearAllMocks();
  notification.createOrderNotification.mockResolvedValue(null);
  state = {
    order: null,
    product: {
      id: ids.product,
      sellerId: ids.seller,
      title: "Kamera analog",
      price: 150000,
      status: "active",
    },
  };

  prisma.product.findUnique.mockImplementation(async () => ({
    ...state.product,
  }));
  prisma.sellerProfile.findUnique.mockResolvedValue({ isOnVacation: false });
  prisma.$queryRaw.mockResolvedValue([{ id: ids.product }]);
  prisma.paymentAccount.findFirst.mockResolvedValue({
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    sellerProfileId: ids.seller,
    type: "BANK",
    providerName: "Bank Demo",
    accountNumberCiphertext: "encrypted-account",
    accountNumberLast4: "9012",
    accountHolderName: "Nadia",
    isActive: true,
  });
  prisma.order.findFirst.mockImplementation(async () =>
    state.order && ["pending", "confirmed"].includes(state.order.status)
      ? { id: state.order.id }
      : null,
  );
  prisma.order.create.mockImplementation(
    async ({ data }: { data: Partial<TestOrder> }) => {
      if (state.order && ["pending", "confirmed"].includes(state.order.status))
        throw { code: "P2002" };
      const now = new Date();
      state.order = {
        ...freshOrder("pending"),
        ...data,
        id: ids.order,
        createdAt: now,
        updatedAt: now,
      } as TestOrder;
      return { ...state.order };
    },
  );
  prisma.order.findUnique.mockImplementation(async () =>
    state.order ? { ...state.order } : null,
  );
  prisma.order.findMany.mockImplementation(
    async ({ where }: { where: Record<string, string> }) =>
      state.order &&
      (state.order.buyerId === where.buyerId ||
        state.order.sellerId === where.sellerId)
        ? [{ ...state.order }]
        : [],
  );
  prisma.product.updateMany.mockImplementation(
    async ({
      where,
      data,
    }: {
      where: { id: string; status: TestProduct["status"] };
      data: { status: TestProduct["status"] };
    }) => {
      if (
        state.product.id !== where.id ||
        state.product.status !== where.status
      )
        return { count: 0 };
      state.product.status = data.status;
      return { count: 1 };
    },
  );
  prisma.order.updateMany.mockImplementation(
    async ({
      where,
      data,
    }: {
      where: Record<string, string>;
      data: Partial<TestOrder>;
    }) => {
      if (
        !state.order ||
        state.order.id !== where.id ||
        state.order.status !== where.status ||
        (where.buyerId && state.order.buyerId !== where.buyerId) ||
        (where.sellerId && state.order.sellerId !== where.sellerId)
      )
        return { count: 0 };
      state.order = { ...state.order, ...data, updatedAt: new Date() };
      return { count: 1 };
    },
  );
  prisma.$transaction.mockImplementation(async (operation: unknown) => {
    if (typeof operation !== "function")
      throw new Error("Expected transaction callback");
    const previous = structuredClone(state);
    try {
      return await (operation as (tx: typeof prisma) => Promise<unknown>)(
        prisma,
      );
    } catch (error) {
      state = previous;
      throw error;
    }
  });
});

const createValues = {
  productId: ids.product,
  shippingName: " Raka Pratama ",
  shippingPhone: " 081234567890 ",
  shippingAddress: " Jl. Merdeka 10, Bandung ",
  note: "  Tolong hubungi dahulu  ",
};

describe("Prisma order service", () => {
  it("creates a pending order using the session buyer and database product owner and price", async () => {
    const result = await createOrder(createValues, ids.buyer);
    expect(result).toMatchObject({
      success: true,
      data: {
        buyerId: ids.buyer,
        sellerId: ids.seller,
        productId: ids.product,
        priceAtOrder: 150000,
        productTitleSnapshot: "Kamera analog",
        status: "pending",
        shippingName: "Raka Pratama",
        note: "Tolong hubungi dahulu",
      },
    });
    expect(state.product.status).toBe("active");
    expect(notification.createOrderNotification).toHaveBeenCalledWith(
      prisma,
      ids.seller,
      ids.order,
      "ORDER_PLACED",
    );
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buyerId: ids.buyer,
          sellerId: ids.seller,
        }),
      }),
    );
  });

  it("keeps the order shipping snapshot after its source address is edited or deleted", async () => {
    let sourceAddress: {
      contactName: string;
      phone: string;
      street: string;
    } | null = {
      contactName: "Raka Pratama",
      phone: "081234567890",
      street: "Jl. Merdeka 10, Bandung",
    };
    const addressAtCheckout = sourceAddress;
    const created = await createOrder(
      {
        ...createValues,
        shippingName: addressAtCheckout.contactName,
        shippingPhone: addressAtCheckout.phone,
        shippingAddress: addressAtCheckout.street,
      },
      ids.buyer,
    );
    expect(created.success).toBe(true);
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shippingName: "Raka Pratama",
        shippingPhone: "081234567890",
        shippingAddress: "Jl. Merdeka 10, Bandung",
      }),
    });

    Object.assign(sourceAddress, {
      contactName: "Alamat Baru",
      phone: "081299999999",
      street: "Jl. Baru 1, Jakarta",
    });
    const unchangedAfterEdit = await getOrder(ids.order, ids.buyer);
    expect(unchangedAfterEdit).toMatchObject({
      shippingName: "Raka Pratama",
      shippingPhone: "081234567890",
      shippingAddress: "Jl. Merdeka 10, Bandung",
    });

    sourceAddress = null;
    expect(sourceAddress).toBeNull();
    const unchangedAfterDelete = await getOrder(ids.order, ids.buyer);
    expect(unchangedAfterDelete).toMatchObject({
      shippingName: "Raka Pratama",
      shippingPhone: "081234567890",
      shippingAddress: "Jl. Merdeka 10, Bandung",
    });
  });

  it("rejects invalid, unauthenticated, own-product, unavailable, and already-open requests", async () => {
    expect(await createOrder(createValues, null)).toMatchObject({
      success: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(
      await createOrder({ ...createValues, sellerId: ids.seller }, ids.buyer),
    ).toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(prisma.product.findUnique).not.toHaveBeenCalled();

    expect(await createOrder(createValues, ids.seller)).toMatchObject({
      success: false,
      error: { code: "FORBIDDEN" },
    });
    state.product.status = "reserved";
    expect(await createOrder(createValues, ids.buyer)).toMatchObject({
      success: false,
      error: { code: "PRODUCT_NOT_AVAILABLE" },
    });
    state.product.status = "active";
    state.order = freshOrder("pending");
    expect(await createOrder(createValues, ids.buyer)).toMatchObject({
      success: false,
      error: { code: "CONFLICT" },
    });
  });

  it("blocks new orders while the seller is on vacation", async () => {
    prisma.sellerProfile.findUnique.mockResolvedValueOnce({
      isOnVacation: true,
    });
    await expect(createOrder(createValues, ids.buyer)).resolves.toMatchObject({
      success: false,
      error: { code: "PRODUCT_NOT_AVAILABLE" },
    });
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it("continues processing an open order while the seller is on vacation", async () => {
    state.order = freshOrder("pending");
    prisma.sellerProfile.findUnique.mockResolvedValue({ isOnVacation: true });
    await expect(
      updateOrderStatus(
        {
          orderId: ids.order,
          action: "confirm",
          paymentAccountId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        },
        ids.seller,
      ),
    ).resolves.toMatchObject({ success: true, data: { status: "confirmed" } });
  });

  it.each([
    ["pending", "confirm", "seller", "confirmed", "reserved"],
    ["pending", "reject", "seller", "rejected", "active"],
    ["pending", "cancel", "buyer", "cancelled", "active"],
    ["confirmed", "complete", "seller", "completed", "sold"],
    ["confirmed", "cancel", "buyer", "cancelled", "active"],
    ["confirmed", "cancel", "seller", "cancelled", "active"],
  ] as const)(
    "performs %s/%s as %s",
    async (initial, action, role, next, productStatus) => {
      state.order = freshOrder(initial);
      state.product.status = initial === "confirmed" ? "reserved" : "active";
      const actorId = role === "buyer" ? ids.buyer : ids.seller;
      const result = await updateOrderStatus(
        {
          orderId: ids.order,
          action,
          ...(action === "confirm"
            ? { paymentAccountId: "ffffffff-ffff-4fff-8fff-ffffffffffff" }
            : {}),
          ...(action === "cancel" ? { reason: " alasan sah " } : {}),
        },
        actorId,
      );
      expect(result).toMatchObject({ success: true, data: { status: next } });
      expect(state.order?.status).toBe(next);
      expect(state.product.status).toBe(productStatus);
      expect(notification.createOrderNotification).toHaveBeenLastCalledWith(
        prisma,
        role === "buyer" ? ids.seller : ids.buyer,
        ids.order,
        {
          confirm: "ORDER_CONFIRMED",
          reject: "ORDER_REJECTED",
          cancel: "ORDER_CANCELLED",
          complete: "ORDER_COMPLETED",
        }[action],
      );
    },
  );

  it("rejects every unauthorized or terminal transition", async () => {
    const forbidden: [
      TestStatus,
      "confirm" | "reject" | "cancel" | "complete",
      string,
    ][] = [
      ["pending", "confirm", ids.buyer],
      ["pending", "reject", ids.buyer],
      ["pending", "cancel", ids.seller],
      ["pending", "complete", ids.seller],
      ["confirmed", "confirm", ids.seller],
      ["confirmed", "reject", ids.seller],
      ["confirmed", "complete", ids.buyer],
      ["completed", "cancel", ids.buyer],
      ["cancelled", "confirm", ids.seller],
      ["rejected", "complete", ids.seller],
    ];
    for (const [initial, action, actorId] of forbidden) {
      state.order = freshOrder(initial);
      state.product.status = initial === "confirmed" ? "reserved" : "active";
      const before = structuredClone(state);
      const result = await updateOrderStatus(
        {
          orderId: ids.order,
          action,
          ...(action === "cancel" ? { reason: "alasan sah" } : {}),
        },
        actorId,
      );
      expect(result).toMatchObject({
        success: false,
        error: { code: "INVALID_STATUS_TRANSITION" },
      });
      expect(state).toEqual(before);
    }
    state.order = freshOrder();
    expect(
      await updateOrderStatus(
        { orderId: ids.order, action: "reject" },
        ids.other,
      ),
    ).toMatchObject({
      success: false,
      error: { code: "FORBIDDEN" },
    });
  });

  it("requires active seller payment and snapshots the chosen instructions on confirmation", async () => {
    state.order = freshOrder("pending");
    prisma.paymentAccount.findFirst.mockResolvedValueOnce(null);
    expect(
      await updateOrderStatus(
        { orderId: ids.order, action: "confirm", paymentAccountId: ids.other },
        ids.seller,
      ),
    ).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
    expect(state.order?.status).toBe("pending");

    const result = await updateOrderStatus(
      {
        orderId: ids.order,
        action: "confirm",
        paymentAccountId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      },
      ids.seller,
    );
    expect(result).toMatchObject({
      success: true,
      data: {
        paymentInstruction: {
          providerName: "Bank Demo",
          accountHolderName: "Nadia",
          accountNumber: "123456789012",
        },
        paymentAccountNumberLast4: "9012",
      },
    });
    const frozenCipher = state.order?.paymentInstructionCiphertext;
    prisma.paymentAccount.findFirst.mockResolvedValueOnce({
      providerName: "Changed",
      accountHolderName: "Changed",
      accountNumberCiphertext: "other",
      accountNumberLast4: "0000",
    });
    const later = await getOrder(ids.order, ids.buyer);
    expect(later?.paymentInstruction?.providerName).toBe("Bank Demo");
    expect(state.order?.paymentInstructionCiphertext).toBe(frozenCipher);
  });

  it.each([
    ["pending", false],
    ["confirmed", true],
    ["completed", true],
    ["cancelled", false],
    ["rejected", false],
  ] as const)(
    "exposes payment snapshot only for allowed %s orders",
    async (status, visible) => {
      state.order = {
        ...freshOrder(status),
        paymentInstructionCiphertext:
          'cipher:{"providerName":"BCA","accountHolderName":"Ayu","accountNumber":"1234567890"}',
        paymentAccountNumberLast4: "7890",
      };
      const buyer = await getOrder(ids.order, ids.buyer);
      const seller = await getOrder(ids.order, ids.seller);
      expect(buyer?.paymentInstruction?.providerName ?? null).toBe(
        visible ? "BCA" : null,
      );
      expect(seller?.paymentInstruction?.providerName ?? null).toBe(
        visible ? "BCA" : null,
      );
      expect(buyer?.paymentAccountNumberLast4 ?? null).toBe(
        visible ? "7890" : null,
      );
    },
  );

  it("enforces trimmed cancel reason lengths and accepts optional rejection reason", async () => {
    state.order = freshOrder();
    for (const reason of ["", "abcd", `a${"x".repeat(500)}`]) {
      expect(
        await updateOrderStatus(
          { orderId: ids.order, action: "cancel", reason },
          ids.buyer,
        ),
      ).toMatchObject({
        success: false,
        error: { code: "VALIDATION_ERROR" },
      });
    }
    for (const reason of ["abcde", "x".repeat(500)]) {
      state.order = freshOrder();
      expect(
        await updateOrderStatus(
          { orderId: ids.order, action: "cancel", reason },
          ids.buyer,
        ),
      ).toMatchObject({ success: true });
    }
    state.order = freshOrder();
    expect(
      await updateOrderStatus(
        { orderId: ids.order, action: "cancel", reason: "  abcde  " },
        ids.buyer,
      ),
    ).toMatchObject({
      success: true,
      data: { cancelReason: "abcde" },
    });
    state.order = freshOrder();
    expect(
      await updateOrderStatus(
        { orderId: ids.order, action: "reject" },
        ids.seller,
      ),
    ).toMatchObject({
      success: true,
      data: { status: "rejected", cancelReason: null },
    });
  });

  it("returns participant-only DTOs and applies all five seller contact visibility rows", async () => {
    const statuses: [TestStatus, boolean][] = [
      ["pending", false],
      ["confirmed", true],
      ["completed", true],
      ["cancelled", false],
      ["rejected", false],
    ];
    for (const [status, visible] of statuses) {
      state.order = freshOrder(status);
      const buyer = await getOrder(ids.order, ids.buyer);
      const seller = await getOrder(ids.order, ids.seller);
      expect(buyer?.shippingPhone).toBe("081234567890");
      expect(buyer?.shippingAddress).toBe("Jl. Merdeka 10, Bandung");
      expect(seller?.shippingName).toBe("Raka Pratama");
      expect(seller?.shippingPhone).toBe(visible ? "081234567890" : null);
      expect(seller?.shippingAddress).toBe(
        visible ? "Jl. Merdeka 10, Bandung" : null,
      );
      expect(await getOrder(ids.order, ids.other)).toBeNull();
      expect(JSON.stringify(seller)).not.toContain("passwordHash");
    }
  });

  it("filters buyer and seller lists by session identity and masks seller contacts", async () => {
    state.order = freshOrder("pending");
    const lists = await getOrders(ids.seller);
    expect(lists.purchases).toHaveLength(0);
    expect(lists.sales[0]).toMatchObject({
      shippingName: "Raka Pratama",
      shippingPhone: null,
      shippingAddress: null,
    });
  });

  it("rolls back product changes when the guarded order update loses a race", async () => {
    state.order = freshOrder("pending");
    prisma.order.updateMany.mockResolvedValueOnce({ count: 0 });
    const result = await updateOrderStatus(
      {
        orderId: ids.order,
        action: "confirm",
        paymentAccountId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      },
      ids.seller,
    );
    expect(result).toMatchObject({
      success: false,
      error: { code: "CONFLICT" },
    });
    expect(state.order?.status).toBe("pending");
    expect(state.product.status).toBe("active");
  });

  it("rolls back order and product changes when notification creation fails", async () => {
    notification.createOrderNotification.mockRejectedValueOnce(
      new Error("notification insert failed"),
    );
    await expect(createOrder(createValues, ids.buyer)).resolves.toMatchObject({
      success: false,
      error: { code: "INTERNAL_ERROR" },
    });
    expect(state.order).toBeNull();
    expect(state.product.status).toBe("active");
  });

  it("rolls back a status transition if its notification cannot be created", async () => {
    state.order = freshOrder("pending");
    notification.createOrderNotification.mockRejectedValueOnce(
      new Error("notification insert failed"),
    );
    await expect(
      updateOrderStatus(
        {
          orderId: ids.order,
          action: "confirm",
          paymentAccountId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        },
        ids.seller,
      ),
    ).resolves.toMatchObject({
      success: false,
      error: { code: "INTERNAL_ERROR" },
    });
    expect(state.order?.status).toBe("pending");
    expect(state.product.status).toBe("active");
  });

  it("maps the database open-order unique conflict to a safe response", async () => {
    prisma.order.create.mockRejectedValueOnce({
      code: "P2002",
      meta: { target: "private-db-detail" },
    });
    expect(await createOrder(createValues, ids.buyer)).toMatchObject({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Produk sudah memiliki pesanan terbuka.",
      },
    });
  });
});
