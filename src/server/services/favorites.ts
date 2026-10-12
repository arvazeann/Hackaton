import { db } from "@/lib/db";
import { favoriteSchema } from "@/schemas";
import type { ActionResult, ProductListItem } from "@/types";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const fail = <T = never>(
  code:
    | "UNAUTHENTICATED"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "CONFLICT"
    | "INTERNAL_ERROR",
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> => ({
  success: false,
  error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) },
});

const ok = <T>(data: T): ActionResult<T> => ({ success: true, data });

type FavoriteRecord = {
  product: {
    id: string;
    title: string;
    price: number;
    condition: ProductListItem["condition"];
    city: string;
    status: ProductListItem["status"];
    createdAt: Date;
    category: ProductListItem["category"];
    seller: ProductListItem["seller"];
    images: { url: string; position: number }[];
  };
};

function mapFavorite({ product }: FavoriteRecord): ProductListItem {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    condition: product.condition,
    city: product.city,
    status: product.status,
    coverImageUrl: product.images[0]?.url ?? "/products/item-1.svg",
    category: product.category,
    seller: product.seller,
    isFavorited: true,
    createdAt: product.createdAt.toISOString(),
  };
}

function prismaCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error)
    return typeof error.code === "string" ? error.code : undefined;
  return undefined;
}

export async function getFavorites(userId: string): Promise<ProductListItem[]> {
  if (!isUuid(userId)) return [];
  const records = await db.favorite.findMany({
    where: { userId, product: { status: { not: "archived" } } },
    include: {
      product: {
        include: {
          category: true,
          seller: { select: { id: true, name: true } },
          images: { orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return (records as FavoriteRecord[]).map(mapFavorite);
}

export async function isProductFavorited(
  productId: string,
  userId: string,
): Promise<boolean> {
  if (!isUuid(productId) || !isUuid(userId)) return false;
  const favorite = await db.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { userId: true },
  });
  return Boolean(favorite);
}

export async function setFavorite(
  rawInput: unknown,
  userId: string | null,
  isFavorited: boolean,
): Promise<ActionResult<{ id: string; isFavorited: boolean }>> {
  if (!userId || !isUuid(userId))
    return fail("UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  const parsed = favoriteSchema.safeParse(rawInput);
  if (!parsed.success)
    return fail(
      "VALIDATION_ERROR",
      "Produk tidak valid.",
      parsed.error.flatten().fieldErrors,
    );
  try {
    if (isFavorited) {
      const product = await db.product.findUnique({
        where: { id: parsed.data.productId },
        select: { id: true, status: true },
      });
      if (!product || product.status === "archived")
        return fail("NOT_FOUND", "Produk tidak ditemukan.");
      await db.favorite.upsert({
        where: {
          userId_productId: { userId, productId: product.id },
        },
        create: { userId, productId: product.id },
        update: {},
      });
    } else {
      await db.favorite.deleteMany({
        where: { userId, productId: parsed.data.productId },
      });
    }
    return ok({ id: parsed.data.productId, isFavorited });
  } catch (error) {
    const code = prismaCode(error);
    if (code === "P2002") {
      const favorite = await db.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: parsed.data.productId,
          },
        },
        select: { userId: true },
      });
      if (isFavorited && favorite)
        return ok({ id: parsed.data.productId, isFavorited: true });
      return fail("CONFLICT", "Favorit berubah. Muat ulang lalu coba lagi.");
    }
    if (code === "P2003" || code === "P2025")
      return fail("NOT_FOUND", "Produk atau akun tidak ditemukan.");
    return fail("INTERNAL_ERROR", "Favorit gagal diperbarui.");
  }
}
