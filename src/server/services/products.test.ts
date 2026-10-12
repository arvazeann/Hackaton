import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  productImage: { deleteMany: vi.fn(), findMany: vi.fn() },
  favorite: { findMany: vi.fn(), findUnique: vi.fn() },
  category: { findMany: vi.fn() },
  sellerProfile: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: prisma }));
const storage = vi.hoisted(() => ({
  exists: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/server/storage/local-image-storage", () => ({
  localImageStorage: storage,
}));

import {
  archiveProduct,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "@/server/services/products";

const record = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  sellerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  categoryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  title: "Kamera analog",
  description: "Kondisi baik",
  price: 100000,
  condition: "good",
  status: "active",
  city: "Bandung",
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-02T00:00:00.000Z"),
  category: {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    name: "Elektronik",
    slug: "elektronik",
  },
  seller: {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    name: "Nadia Putri",
    city: "Bandung",
    phone: "081234567890",
    passwordHash: "must-not-leak",
  },
  images: [
    {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      storageKey: "local/product/0",
      url: "/products/item-1.svg",
      position: 0,
    },
  ],
};

const input = {
  title: "Kamera analog",
  description: "Kondisi baik",
  price: 100000,
  categoryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  condition: "good",
  city: "Bandung",
  images: [
    {
      storageKey: "dddddddd-dddd-4ddd-8ddd-dddddddddddd.jpg",
      position: 0,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  storage.exists.mockResolvedValue(true);
  storage.delete.mockResolvedValue(undefined);
  prisma.$transaction.mockImplementation((operation: unknown) => {
    if (typeof operation === "function")
      return Promise.resolve(
        (operation as (transaction: typeof prisma) => unknown)(prisma),
      );
    if (Array.isArray(operation)) return Promise.all(operation);
    return Promise.resolve([]);
  });
  prisma.productImage.findMany.mockResolvedValue([]);
  prisma.sellerProfile.findUnique.mockResolvedValue({ province: "Jawa Barat" });
});

describe("product Prisma service", () => {
  it("creates validated product data for the session owner", async () => {
    prisma.product.create.mockResolvedValue(record);
    const result = await createProduct(input, record.sellerId);
    expect(result.success).toBe(true);
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sellerId: record.sellerId }),
      }),
    );
    if (result.success) {
      expect(result.data.category).toEqual(record.category);
      expect(result.data.images).toEqual([
        {
          id: record.images[0].id,
          storageKey: "/products/item-1.svg",
          url: "/products/item-1.svg",
          position: 0,
        },
      ]);
      expect(JSON.stringify(result.data)).not.toContain("phone");
      expect(JSON.stringify(result.data)).not.toContain("passwordHash");
    }
  });

  it("rejects unauthenticated and invalid create requests before Prisma", async () => {
    expect(await createProduct(input, null)).toMatchObject({
      success: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(
      await createProduct({ ...input, price: 0 }, record.sellerId),
    ).toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("blocks product creation until an activated store has a province", async () => {
    prisma.sellerProfile.findUnique.mockResolvedValueOnce(null);
    const noStore = await createProduct(input, record.sellerId);
    expect(noStore).toMatchObject({
      success: false,
      error: { code: "FORBIDDEN" },
    });
    prisma.sellerProfile.findUnique.mockResolvedValueOnce({ province: null });
    const incompleteStore = await createProduct(input, record.sellerId);
    expect(incompleteStore).toMatchObject({
      success: false,
      error: { code: "FORBIDDEN" },
    });
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("maps stored image filenames to public upload URLs and persists only keys", async () => {
    const uploadedKey = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.webp";
    prisma.product.create.mockResolvedValue({
      ...record,
      images: [
        {
          id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          storageKey: uploadedKey,
          url: uploadedKey,
          position: 0,
        },
      ],
    });

    const result = await createProduct(
      { ...input, images: [{ storageKey: uploadedKey, position: 0 }] },
      record.sellerId,
    );

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          images: {
            create: [
              { storageKey: uploadedKey, url: uploadedKey, position: 0 },
            ],
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      success: true,
      data: {
        coverImageUrl: `/uploads/${uploadedKey}`,
        images: [{ storageKey: uploadedKey, url: `/uploads/${uploadedKey}` }],
      },
    });
  });

  it("rejects missing upload files before writing product data", async () => {
    storage.exists.mockResolvedValue(false);
    const result = await createProduct(input, record.sellerId);
    expect(result).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: { images: expect.any(Array) },
      },
    });
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("deletes removed local files only after a successful product edit", async () => {
    const removedKey = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.webp";
    prisma.product.findUnique.mockResolvedValue(record);
    prisma.productImage.findMany.mockResolvedValue([
      { storageKey: removedKey },
    ]);
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    prisma.productImage.deleteMany.mockResolvedValue({ count: 1 });
    prisma.product.update.mockResolvedValue(record);

    const result = await updateProduct(record.id, input, record.sellerId);

    expect(result.success).toBe(true);
    expect(storage.delete).toHaveBeenCalledWith(removedKey);
  });

  it("lists active products with filters, sorting, and pagination", async () => {
    prisma.product.findMany.mockResolvedValue([record]);
    prisma.product.count.mockResolvedValue(1);
    const result = await listProducts({
      q: "kamera",
      category: "elektronik",
      sort: "price_asc",
      page: "2",
      pageSize: "6",
    });
    expect(result).toMatchObject({
      total: 1,
      page: 2,
      pageSize: 6,
      totalPages: 1,
      items: [{ id: record.id, category: record.category }],
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "active",
          category: { slug: "elektronik" },
        }),
        orderBy: { price: "asc" },
        skip: 6,
        take: 6,
      }),
    );
  });

  it("includes favorite state for the authenticated viewer in list and detail DTOs", async () => {
    prisma.product.findMany.mockResolvedValue([record]);
    prisma.product.count.mockResolvedValue(1);
    prisma.favorite.findMany.mockResolvedValue([{ productId: record.id }]);
    prisma.favorite.findUnique.mockResolvedValue({ userId: record.sellerId });

    const list = await listProducts({}, record.sellerId);
    expect(list.items[0].isFavorited).toBe(true);
    expect(prisma.favorite.findMany).toHaveBeenCalledWith({
      where: { userId: record.sellerId, productId: { in: [record.id] } },
      select: { productId: true },
    });

    prisma.product.findUnique.mockResolvedValue(record);
    const detail = await getProduct(record.id, record.sellerId);
    expect(detail?.isFavorited).toBe(true);
    expect(prisma.favorite.findUnique).toHaveBeenCalledWith({
      where: {
        userId_productId: { userId: record.sellerId, productId: record.id },
      },
      select: { userId: true },
    });
  });

  it("returns product detail without seller private fields and hides other archived products", async () => {
    prisma.product.findUnique.mockResolvedValue(record);
    const detail = await getProduct(record.id);
    expect(detail?.seller).toEqual({
      id: record.seller.id,
      name: record.seller.name,
      city: record.seller.city,
    });
    expect(JSON.stringify(detail)).not.toContain("081234567890");
    expect(JSON.stringify(detail)).not.toContain("must-not-leak");

    prisma.product.findUnique.mockResolvedValue({
      ...record,
      status: "archived",
    });
    expect(await getProduct(record.id, "another-user")).toBeNull();
    expect(await getProduct("p1")).toBeNull();
  });

  it("updates only owned active products and rejects another owner's product", async () => {
    prisma.product.findUnique.mockResolvedValue(record);
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    prisma.productImage.deleteMany.mockResolvedValue({ count: 1 });
    prisma.product.update.mockResolvedValue({
      ...record,
      title: "Kamera baru",
    });
    const updated = await updateProduct(record.id, input, record.sellerId);
    expect(updated).toMatchObject({
      success: true,
      data: { title: "Kamera baru" },
    });
    expect(prisma.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: record.id, sellerId: record.sellerId, status: "active" },
      }),
    );

    prisma.product.findUnique.mockResolvedValue(record);
    const forbidden = await updateProduct(
      record.id,
      input,
      "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    );
    expect(forbidden).toMatchObject({
      success: false,
      error: { code: "FORBIDDEN" },
    });
  });

  it("archives an owned active product without deleting it", async () => {
    prisma.product.findUnique.mockResolvedValue(record);
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    expect(await archiveProduct(record.id, record.sellerId)).toEqual({
      success: true,
      data: { id: record.id },
    });
    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: record.id, sellerId: record.sellerId, status: "active" },
      data: { status: "archived" },
    });
  });
});
