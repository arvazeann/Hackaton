import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  address: {
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  sellerProfile: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  paymentAccount: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  uploadedFile: { findFirst: vi.fn() },
  order: { count: vi.fn(), findMany: vi.fn(), aggregate: vi.fn() },
  product: { groupBy: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: prisma }));
import {
  deactivatePaymentAccount,
  deleteAddress,
  getProfileHub,
  hasPendingOrdersWithoutPaymentAccount,
  saveAddress,
  savePaymentAccount,
  saveStore,
} from "@/server/services/profile-hub";
import { updateProfile } from "@/server/services/profile";

const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const validAddress = {
  kind: "SHIPPING",
  label: "Rumah",
  contactName: "Ayu",
  phone: "081234567890",
  street: "Jalan Melati 1",
  city: "Bandung",
  province: "Jawa Barat",
  postalCode: "40123",
  isDefault: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(
    async (operation: (tx: unknown) => unknown) =>
      operation({
        $queryRaw: vi.fn(),
        address: prisma.address,
        sellerProfile: prisma.sellerProfile,
        paymentAccount: prisma.paymentAccount,
      }),
  );
  prisma.address.count.mockResolvedValue(0);
  prisma.address.updateMany.mockResolvedValue({ count: 1 });
  prisma.address.create.mockImplementation(
    async ({ data }: { data: unknown }) => data,
  );
  prisma.sellerProfile.findUnique.mockResolvedValue(null);
  prisma.paymentAccount.count.mockResolvedValue(0);
  prisma.uploadedFile.findFirst.mockResolvedValue(null);
  process.env.PAYMENT_ENCRYPTION_KEY = Buffer.alloc(32, 2).toString("base64");
});

describe("profile hub services", () => {
  it("serializes default address changes and scopes them by owner and kind", async () => {
    const result = await saveAddress(owner, validAddress);
    expect(result.ok).toBe(true);
    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: owner, kind: "SHIPPING" },
      data: { isDefault: false },
    });
    expect(prisma.address.create).toHaveBeenCalledWith({
      data: { ...validAddress, userId: owner },
    });
  });

  it("enforces per-kind address limits and never deletes another user's address", async () => {
    prisma.address.count.mockResolvedValueOnce(10);
    expect(await saveAddress(owner, validAddress)).toMatchObject({ ok: false });
    expect(prisma.address.create).not.toHaveBeenCalled();
    prisma.address.deleteMany.mockResolvedValue({ count: 0 });
    await deleteAddress(owner, "address-id");
    expect(prisma.address.deleteMany).toHaveBeenCalledWith({
      where: { id: "address-id", userId: owner },
    });
    expect(prisma.address.deleteMany).not.toHaveBeenCalledWith({
      where: { id: "address-id", userId: other },
    });
  });

  it("cannot update an address owned by another user", async () => {
    prisma.address.findFirst.mockResolvedValue(null);
    const result = await saveAddress(owner, {
      ...validAddress,
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    });
    expect(result).toMatchObject({ ok: false });
    expect(prisma.address.findFirst).toHaveBeenCalledWith({
      where: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", userId: owner },
      select: { id: true },
    });
    expect(prisma.address.update).not.toHaveBeenCalled();
  });

  it("does not accept a foreign or wrong-purpose logo key", async () => {
    const result = await saveStore(owner, {
      storeName: "Toko Ayu",
      description: "",
      logoKey: "ffffffff-ffff-4fff-8fff-ffffffffffff.jpg",
      city: "Bandung",
      province: "Jawa Barat",
    });
    expect(result).toMatchObject({ ok: false });
    expect(prisma.uploadedFile.findFirst).toHaveBeenCalledWith({
      where: {
        key: "ffffffff-ffff-4fff-8fff-ffffffffffff.jpg",
        ownerId: owner,
        purpose: "LOGO",
      },
      select: { key: true },
    });
    expect(prisma.sellerProfile.create).not.toHaveBeenCalled();
  });

  it("rejects a foreign avatar key and a logo key registered for another purpose", async () => {
    const profileInput = {
      name: "Ayu",
      phone: "081234567890",
      city: "Bandung",
      bio: "",
      avatarKey: "ffffffff-ffff-4fff-8fff-ffffffffffff.jpg",
    };
    const avatarResult = await updateProfile(profileInput, owner);
    expect(avatarResult).toMatchObject({ success: false });
    expect(prisma.uploadedFile.findFirst).toHaveBeenCalledWith({
      where: {
        key: "ffffffff-ffff-4fff-8fff-ffffffffffff.jpg",
        ownerId: owner,
        purpose: "AVATAR",
      },
      select: { key: true },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();

    const logoResult = await saveStore(owner, {
      storeName: "Toko Ayu",
      description: "",
      logoKey: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.jpg",
      city: "Bandung",
      province: "Jawa Barat",
    });
    expect(logoResult).toMatchObject({ ok: false });
    expect(prisma.uploadedFile.findFirst).toHaveBeenLastCalledWith({
      where: {
        key: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.jpg",
        ownerId: owner,
        purpose: "LOGO",
      },
      select: { key: true },
    });
    expect(prisma.sellerProfile.create).not.toHaveBeenCalled();
  });

  it("shows the seller blocker only when pending orders have no active payment account", async () => {
    prisma.order.count.mockResolvedValue(1);
    prisma.paymentAccount.count.mockResolvedValue(0);
    expect(await hasPendingOrdersWithoutPaymentAccount(owner)).toBe(true);
    prisma.paymentAccount.count.mockResolvedValue(1);
    expect(await hasPendingOrdersWithoutPaymentAccount(owner)).toBe(false);
    prisma.order.count.mockResolvedValue(0);
    prisma.paymentAccount.count.mockResolvedValue(0);
    expect(await hasPendingOrdersWithoutPaymentAccount(owner)).toBe(false);
  });

  it("enforces three active payment accounts, scopes edits/deactivation to the owner, and masks account numbers", async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({ userId: owner });
    prisma.paymentAccount.count.mockResolvedValue(3);
    const result = await savePaymentAccount(owner, {
      type: "BANK",
      providerName: "BCA",
      accountNumber: "1234567890",
      accountHolderName: "Ayu",
    });
    expect(result).toMatchObject({ ok: false });
    expect(prisma.paymentAccount.create).not.toHaveBeenCalled();

    prisma.paymentAccount.updateMany.mockResolvedValue({ count: 0 });
    expect(await deactivatePaymentAccount(owner, "foreign-account")).toBe(
      false,
    );
    expect(prisma.paymentAccount.updateMany).toHaveBeenCalledWith({
      where: { id: "foreign-account", sellerProfileId: owner, isActive: true },
      data: { isActive: false },
    });

    prisma.paymentAccount.findFirst.mockResolvedValue(null);
    expect(
      await savePaymentAccount(owner, {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        type: "BANK",
        providerName: "BCA",
        accountNumber: "1234567890",
        accountHolderName: "Ayu",
      }),
    ).toMatchObject({ ok: false });
    expect(prisma.paymentAccount.findFirst).toHaveBeenCalledWith({
      where: {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        sellerProfileId: owner,
      },
      select: { id: true },
    });
    expect(prisma.paymentAccount.update).not.toHaveBeenCalled();
  });

  it("uses database aggregates for dashboard totals and never returns password hashes or payment ciphertext", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: owner,
      name: "Ayu",
      email: "ayu@example.id",
      phone: null,
      city: "Bandung",
      bio: null,
      avatarKey: null,
      passwordHash: "secret",
    });
    prisma.address.findMany.mockResolvedValue([]);
    prisma.sellerProfile.findUnique.mockResolvedValue({
      userId: owner,
      storeName: "Ayu",
      slug: "ayu",
      description: "",
      logoKey: null,
      city: "Bandung",
      province: "Jawa Barat",
    });
    prisma.paymentAccount.findMany.mockResolvedValue([
      {
        id: "payment-id",
        type: "BANK",
        providerName: "BCA",
        accountNumberCiphertext: "private",
        accountNumberLast4: "7890",
        accountHolderName: "Ayu",
        isActive: true,
      },
    ]);
    prisma.order.count.mockResolvedValue(2);
    prisma.order.findMany.mockResolvedValue([]);
    prisma.product.groupBy.mockResolvedValue([
      { status: "active", _count: { _all: 4 } },
    ]);
    prisma.order.aggregate.mockResolvedValue({ _sum: { priceAtOrder: 5000 } });
    const result = await getProfileHub(owner);
    expect(result?.seller).toMatchObject({
      completedSales: 2,
      totalRevenue: 5000,
      productsByStatus: { active: 4 },
    });
    expect(result?.paymentAccounts[0]).not.toHaveProperty(
      "accountNumberCiphertext",
    );
    expect(JSON.stringify(result)).not.toContain("passwordHash");
    expect(prisma.order.aggregate).toHaveBeenCalledWith({
      where: { sellerId: owner, status: "completed" },
      _sum: { priceAtOrder: true },
    });
  });
});
