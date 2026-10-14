import { db } from "@/lib/db";
import { productQuerySchema, productSchema } from "@/schemas";
import type {
  ActionResult,
  Category,
  ProductDetail,
  ProductListItem,
} from "@/types";
import type { z } from "zod";
import {
  LEGACY_IMAGE_KEY_PATTERN,
  productImageUrl,
  STORED_IMAGE_FILENAME_PATTERN,
} from "@/lib/product-images";
import { localImageStorage } from "@/server/storage/local-image-storage";
import { ownsUploadedFile } from "@/server/services/uploaded-files";
import { publicStoreDtoSchema } from "@/schemas";
import type { PublicStoreDTO } from "@/types";

type ProductInput = z.infer<typeof productSchema>;
type ProductQuery = z.infer<typeof productQuerySchema>;
type ProductRecord = NonNullable<
  Awaited<ReturnType<typeof db.product.findUnique>>
> & {
  category: { id: string; name: string; slug: string };
  seller: {
    id: string;
    name: string;
    city: string | null;
    sellerProfile?: { slug: string; isOnVacation: boolean } | null;
  };
  images: { id: string; storageKey: string; url: string; position: number }[];
};

const fail = <T = never>(
  code:
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "UNAUTHENTICATED"
    | "CONFLICT"
    | "INTERNAL_ERROR",
  message: string,
): ActionResult<T> => ({ success: false, error: { code, message } });
const ok = <T>(data: T): ActionResult<T> => ({ success: true, data });
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

function mapCategory(category: ProductRecord["category"]): Category {
  return { id: category.id, name: category.name, slug: category.slug };
}

function mapListItem(
  product: ProductRecord,
  isFavorited = false,
): ProductListItem {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    condition: product.condition,
    city: product.city,
    status: product.status,
    coverImageUrl: product.images[0]
      ? productImageUrl(product.images[0].storageKey, product.images[0].url)
      : "/products/item-1.svg",
    category: mapCategory(product.category),
    seller: {
      id: product.seller.id,
      name: product.seller.name,
      storeSlug: product.seller.sellerProfile?.slug ?? null,
    },
    isFavorited,
    createdAt: product.createdAt.toISOString(),
  };
}

function mapDetail(product: ProductRecord, isFavorited = false): ProductDetail {
  return {
    ...mapListItem(product, isFavorited),
    description: product.description,
    images: product.images.map(({ id, storageKey, url, position }) => {
      const publicUrl = productImageUrl(storageKey, url);
      return {
        id,
        storageKey: STORED_IMAGE_FILENAME_PATTERN.test(storageKey)
          ? storageKey
          : publicUrl,
        url: publicUrl,
        position,
      };
    }),
    seller: {
      id: product.seller.id,
      name: product.seller.name,
      city: product.seller.city ?? product.city,
      storeSlug: product.seller.sellerProfile?.slug ?? null,
      isOnVacation: product.seller.sellerProfile?.isOnVacation ?? false,
    },
    updatedAt: product.updatedAt.toISOString(),
  };
}

const productInclude = {
  category: true,
  seller: {
    select: {
      id: true,
      name: true,
      city: true,
      sellerProfile: { select: { slug: true, isOnVacation: true } },
    },
  },
  images: { orderBy: { position: "asc" as const } },
};

function localImages(input: ProductInput) {
  return input.images.map((image, position) => ({
    storageKey: image.storageKey,
    // Keep the existing non-null column compatible without storing a URL.
    url: image.storageKey,
    position,
  }));
}

async function hasInvalidImage(input: ProductInput, ownerId: string) {
  const stored = await Promise.all(
    input.images.map(async ({ storageKey }) => {
      if (LEGACY_IMAGE_KEY_PATTERN.test(storageKey))
        return localImageStorage.exists(storageKey);

      const [exists, owned] = await Promise.all([
        localImageStorage.exists(storageKey),
        ownsUploadedFile(storageKey, ownerId, "PRODUCT"),
      ]);
      return exists && owned;
    }),
  );
  return stored.some((valid) => !valid);
}

function imageValidationFailure(): ActionResult<never> {
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Periksa kembali isian form.",
      fieldErrors: { images: ["Unggah ulang foto yang tidak tersedia."] },
    },
  };
}

function prismaError(error: unknown): ActionResult<never> {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  )
    return fail("CONFLICT", "Foto produk sudah digunakan.");
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2003"
  )
    return fail("VALIDATION_ERROR", "Kategori atau akun tidak ditemukan.");
  return fail("INTERNAL_ERROR", "Produk gagal diproses.");
}

export async function getProductCategories(): Promise<Category[]> {
  return db.category.findMany({ orderBy: { name: "asc" } });
}

async function favoriteIdsFor(
  userId: string | undefined,
  productIds: string[],
): Promise<Set<string>> {
  if (!userId || !isUuid(userId) || productIds.length === 0) return new Set();
  const favorites = await db.favorite.findMany({
    where: { userId, productId: { in: productIds } },
    select: { productId: true },
  });
  return new Set(favorites.map(({ productId }) => productId));
}

export async function listProducts(
  input: unknown = {},
  viewerId?: string,
): Promise<{
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const query: ProductQuery = productQuerySchema.parse(input);
  const where = {
    status: "active" as const,
    seller: { sellerProfile: { isNot: { isOnVacation: true } } },
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            {
              description: {
                contains: query.q,
                mode: "insensitive" as const,
              },
            },
            { city: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.city
      ? { city: { contains: query.city, mode: "insensitive" as const } }
      : {}),
    ...(query.condition ? { condition: query.condition } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
  };
  const orderBy =
    query.sort === "price_asc"
      ? { price: "asc" as const }
      : query.sort === "price_desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };
  const [records, total] = await db.$transaction([
    db.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.product.count({ where }),
  ]);
  const productRecords = records as ProductRecord[];
  const favoriteIds = await favoriteIdsFor(
    viewerId,
    productRecords.map(({ id }) => id),
  );
  return {
    items: productRecords.map((product) =>
      mapListItem(product, favoriteIds.has(product.id)),
    ),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getPublicStore(
  slug: string,
  input: unknown = {},
  viewerId?: string,
): Promise<PublicStoreDTO | null> {
  const query = productQuerySchema.parse(input);
  const store = await db.sellerProfile.findUnique({
    where: { slug },
    select: {
      userId: true,
      storeName: true,
      slug: true,
      description: true,
      logoKey: true,
      city: true,
      province: true,
      isOnVacation: true,
      user: { select: { createdAt: true } },
    },
  });
  if (!store) return null;
  const productWhere = { sellerId: store.userId, status: "active" as const };
  const [records, total, completedSales, favoriteIds] = await Promise.all([
    db.product.findMany({
      where: productWhere,
      select: {
        id: true,
        title: true,
        price: true,
        condition: true,
        city: true,
        status: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        seller: {
          select: {
            id: true,
            name: true,
            sellerProfile: { select: { slug: true } },
          },
        },
        images: {
          select: { storageKey: true, url: true, position: true },
          orderBy: { position: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.product.count({ where: productWhere }),
    db.order.count({ where: { sellerId: store.userId, status: "completed" } }),
    viewerId
      ? db.favorite.findMany({
          where: {
            userId: viewerId,
            product: { sellerId: store.userId, status: "active" },
          },
          select: { productId: true },
        })
      : Promise.resolve([]),
  ]);
  const favoritedIds = new Set(favoriteIds.map((item) => item.productId));
  const dto = {
    storeName: store.storeName,
    slug: store.slug,
    description: store.description,
    logoUrl: store.logoKey ? `/uploads/${store.logoKey}` : null,
    city: store.city,
    province: store.province,
    joinedAt: store.user.createdAt.toISOString(),
    completedSales,
    isOnVacation: store.isOnVacation,
    products: records.map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      condition: product.condition,
      city: product.city,
      status: product.status,
      coverImageUrl: product.images[0]
        ? productImageUrl(product.images[0].storageKey, product.images[0].url)
        : "/products/item-1.svg",
      category: product.category,
      seller: {
        id: product.seller.id,
        name: product.seller.name,
        storeSlug: product.seller.sellerProfile?.slug ?? null,
      },
      isFavorited: favoritedIds.has(product.id),
      createdAt: product.createdAt.toISOString(),
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize),
  };
  return publicStoreDtoSchema.parse(dto);
}

export async function getProduct(
  id: string,
  viewerId?: string,
): Promise<ProductDetail | null> {
  if (!isUuid(id)) return null;
  const record = await db.product.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!record || (record.status === "archived" && record.sellerId !== viewerId))
    return null;
  let isFavorited = false;
  if (viewerId && isUuid(viewerId)) {
    isFavorited = Boolean(
      await db.favorite.findUnique({
        where: { userId_productId: { userId: viewerId, productId: id } },
        select: { userId: true },
      }),
    );
  }
  return mapDetail(record as ProductRecord, isFavorited);
}

export async function getProductsBySeller(
  sellerId: string,
  viewerId = sellerId,
): Promise<ProductListItem[]> {
  if (!isUuid(sellerId)) return [];
  const records = await db.product.findMany({
    where: { sellerId },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
  const productRecords = records as ProductRecord[];
  const favoriteIds = await favoriteIdsFor(
    viewerId,
    productRecords.map(({ id }) => id),
  );
  return productRecords.map((product) =>
    mapListItem(product, favoriteIds.has(product.id)),
  );
}

export async function createProduct(
  rawInput: unknown,
  sellerId: string | null,
): Promise<ActionResult<ProductDetail>> {
  if (!sellerId)
    return fail("UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  const parsed = productSchema.safeParse(rawInput);
  if (!parsed.success)
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Periksa kembali isian form.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  if (!isUuid(sellerId)) return fail("UNAUTHENTICATED", "Sesi tidak valid.");
  const store = await db.sellerProfile.findUnique({
    where: { userId: sellerId },
    select: { province: true },
  });
  if (!store || !store.province)
    return fail(
      "FORBIDDEN",
      "Aktifkan dan lengkapi profil toko sebelum membuat produk.",
    );
  if (await hasInvalidImage(parsed.data, sellerId))
    return imageValidationFailure();
  try {
    const id = crypto.randomUUID();
    const record = await db.product.create({
      data: {
        id,
        sellerId,
        categoryId: parsed.data.categoryId,
        title: parsed.data.title,
        description: parsed.data.description,
        price: parsed.data.price,
        condition: parsed.data.condition,
        city: parsed.data.city,
        images: { create: localImages(parsed.data) },
      },
      include: productInclude,
    });
    return ok(mapDetail(record as ProductRecord));
  } catch (error) {
    return prismaError(error);
  }
}

export async function updateProduct(
  id: string,
  rawInput: unknown,
  sellerId: string | null,
): Promise<ActionResult<ProductDetail>> {
  if (!sellerId)
    return fail("UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  const parsed = productSchema.safeParse(rawInput);
  if (!parsed.success)
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Periksa kembali isian form.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  if (!isUuid(id) || !isUuid(sellerId))
    return fail("NOT_FOUND", "Produk tidak ditemukan.");
  if (await hasInvalidImage(parsed.data, sellerId))
    return imageValidationFailure();
  try {
    const removedImageKeys: string[] = [];
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing)
        return fail<ProductDetail>("NOT_FOUND", "Produk tidak ditemukan.");
      if (existing.sellerId !== sellerId)
        return fail<ProductDetail>(
          "FORBIDDEN",
          "Kamu tidak memiliki produk ini.",
        );
      if (existing.status !== "active")
        return fail<ProductDetail>(
          "CONFLICT",
          "Produk hanya dapat diedit saat aktif.",
        );
      const currentImages = await tx.productImage.findMany({
        where: { productId: id },
        select: { storageKey: true },
      });
      const retainedKeys = new Set(
        parsed.data.images.map(({ storageKey }) => storageKey),
      );
      removedImageKeys.push(
        ...currentImages
          .map(({ storageKey }) => storageKey)
          .filter((storageKey) => !retainedKeys.has(storageKey)),
      );
      const claimed = await tx.product.updateMany({
        where: { id, sellerId, status: "active" },
        data: {
          categoryId: parsed.data.categoryId,
          title: parsed.data.title,
          description: parsed.data.description,
          price: parsed.data.price,
          condition: parsed.data.condition,
          city: parsed.data.city,
        },
      });
      if (claimed.count !== 1)
        return fail<ProductDetail>(
          "CONFLICT",
          "Produk tidak dapat diperbarui.",
        );
      await tx.productImage.deleteMany({ where: { productId: id } });
      const record = await tx.product.update({
        where: { id },
        data: {
          images: { create: localImages(parsed.data) },
        },
        include: productInclude,
      });
      return ok(mapDetail(record as ProductRecord));
    });
    if (result.success)
      await Promise.allSettled(
        removedImageKeys.map((storageKey) =>
          localImageStorage.delete(storageKey),
        ),
      );
    return result;
  } catch (error) {
    return prismaError(error);
  }
}

export async function archiveProduct(
  id: string,
  sellerId: string | null,
): Promise<ActionResult<{ id: string }>> {
  if (!sellerId)
    return fail("UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  if (!isUuid(id) || !isUuid(sellerId))
    return fail("NOT_FOUND", "Produk tidak ditemukan.");
  try {
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return fail("NOT_FOUND", "Produk tidak ditemukan.");
    if (existing.sellerId !== sellerId)
      return fail("FORBIDDEN", "Kamu tidak memiliki produk ini.");
    if (existing.status !== "active")
      return fail("CONFLICT", "Produk ini tidak dapat diarsipkan.");
    const updated = await db.product.updateMany({
      where: { id, sellerId, status: "active" },
      data: { status: "archived" },
    });
    if (updated.count !== 1)
      return fail("CONFLICT", "Produk tidak dapat diarsipkan.");
    return ok({ id });
  } catch (error) {
    return prismaError(error);
  }
}
