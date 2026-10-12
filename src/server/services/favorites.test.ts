import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  favorite: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  product: { findUnique: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db: prisma }));

import {
  getFavorites,
  isProductFavorited,
  setFavorite,
} from "@/server/services/favorites";

const ids = {
  user: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  other: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  product: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
};
const product = {
  id: ids.product,
  title: "Kamera analog",
  price: 100000,
  condition: "good" as const,
  city: "Bandung",
  status: "active" as const,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  category: { id: "category-id", name: "Elektronik", slug: "elektronik" },
  seller: { id: ids.other, name: "Nadia" },
  images: [{ url: "/products/item-1.svg", position: 0 }],
};

beforeEach(() => vi.clearAllMocks());

describe("favorite Prisma service", () => {
  it("lists only the current user's favorites as safe product DTOs", async () => {
    prisma.favorite.findMany.mockResolvedValue([{ product }]);
    const result = await getFavorites(ids.user);
    expect(prisma.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: ids.user,
          product: { status: { not: "archived" } },
        },
      }),
    );
    expect(result).toMatchObject([
      { id: ids.product, isFavorited: true, seller: { id: ids.other } },
    ]);
    expect(JSON.stringify(result)).not.toContain("passwordHash");
    expect(JSON.stringify(result)).not.toContain("phone");
  });

  it("returns no favorites for a malformed account ID", async () => {
    expect(await getFavorites("u-buyer")).toEqual([]);
    expect(prisma.favorite.findMany).not.toHaveBeenCalled();
  });

  it("adds favorites idempotently with the session user and database product UUID", async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: ids.product,
      status: "active",
    });
    prisma.favorite.upsert.mockResolvedValue({
      userId: ids.user,
      productId: ids.product,
    });
    const input = { productId: ids.product };
    expect(await setFavorite(input, ids.user, true)).toEqual({
      success: true,
      data: { id: ids.product, isFavorited: true },
    });
    expect(await setFavorite(input, ids.user, true)).toMatchObject({
      success: true,
    });
    expect(prisma.favorite.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.favorite.upsert).toHaveBeenCalledWith({
      where: { userId_productId: { userId: ids.user, productId: ids.product } },
      create: { userId: ids.user, productId: ids.product },
      update: {},
    });
  });

  it("removes favorites idempotently and scopes deletion to the session user", async () => {
    prisma.favorite.deleteMany.mockResolvedValue({ count: 0 });
    expect(
      await setFavorite({ productId: ids.product }, ids.user, false),
    ).toEqual({
      success: true,
      data: { id: ids.product, isFavorited: false },
    });
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: { userId: ids.user, productId: ids.product },
    });
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
  });

  it("does not expose another user's favorites and reports favorite state by compound key", async () => {
    prisma.favorite.findMany.mockResolvedValue([]);
    prisma.favorite.findUnique.mockResolvedValue({ userId: ids.user });
    expect(await getFavorites(ids.other)).toEqual([]);
    expect(prisma.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: ids.other }),
      }),
    );
    expect(await isProductFavorited(ids.product, ids.user)).toBe(true);
    expect(prisma.favorite.findUnique).toHaveBeenCalledWith({
      where: { userId_productId: { userId: ids.user, productId: ids.product } },
      select: { userId: true },
    });
  });

  it("rejects unauthenticated, invalid, missing, and archived products", async () => {
    const input = { productId: ids.product };
    expect(await setFavorite(input, null, true)).toMatchObject({
      success: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(
      await setFavorite({ productId: "p1" }, ids.user, true),
    ).toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(prisma.product.findUnique).not.toHaveBeenCalled();

    prisma.product.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: ids.product,
        status: "archived",
      });
    expect(await setFavorite(input, ids.user, true)).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND" },
    });
    expect(await setFavorite(input, ids.user, true)).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND" },
    });
  });

  it("treats a unique race as success if the favorite now exists", async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: ids.product,
      status: "active",
    });
    prisma.favorite.upsert.mockRejectedValueOnce({ code: "P2002" });
    prisma.favorite.findUnique.mockResolvedValue({ userId: ids.user });
    expect(
      await setFavorite({ productId: ids.product }, ids.user, true),
    ).toEqual({
      success: true,
      data: { id: ids.product, isFavorited: true },
    });
  });
});
