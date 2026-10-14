import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import {
  categories,
  seedOrders,
  seedProducts,
  seedUsers,
} from "../src/lib/seed-data";

loadEnv({ path: [".env.local", ".env"] });

const id = (prefix: number, value: number) =>
  `${prefix.toString().padStart(8, "0")}-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const demoUsers = [
  ...seedUsers,
  {
    id: "u-extra",
    name: "Dewi Lestari",
    email: "dewi@demo.id",
    phone: "081355501234",
    city: "Yogyakarta",
  },
];
const userIds = new Map(
  demoUsers.map((user, index) => [user.id, id(1, index + 1)]),
);
const productIds = new Map(
  seedProducts.map((product, index) => [product.id, id(3, index + 1)]),
);
const orderIds = new Map(
  seedOrders.map((order, index) => [order.id, id(4, index + 1)]),
);
const reservedStoreSlugs = new Set([
  "admin",
  "api",
  "login",
  "register",
  "profile",
  "products",
  "orders",
  "seller",
  "dashboard",
  "favorites",
  "uploads",
  "about",
  "help",
  "settings",
]);

function createDemoStoreSlug(name: string, used: Set<string>) {
  let base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "toko";
  if (reservedStoreSlugs.has(base)) base = `${base}-store`;
  base = base.slice(0, 100);
  let slug = `${base}-demo`;
  let suffix = 2;
  while (used.has(slug)) {
    const ending = `-${suffix++}`;
    slug = `${base.slice(0, 120 - ending.length)}${ending}`;
  }
  used.add(slug);
  return slug;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const environment =
    process.env.DEPLOYMENT_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development";
  const categoryIds = new Map<string, string>();

  try {
    await prisma.$transaction(async (tx) => {
      for (const category of categories) {
        const storedCategory = await tx.category.upsert({
          where: { slug: category.slug },
          create: { name: category.name, slug: category.slug },
          update: { name: category.name },
          select: { id: true },
        });
        categoryIds.set(category.slug, storedCategory.id);
      }

      if (!["development", "staging"].includes(environment)) {
        console.info(
          "Seed kategori selesai; data demo dilewati untuk environment non-development.",
        );
        return;
      }

      const passwordHash = await bcrypt.hash("preloved-demo", 12);
      for (const user of demoUsers) {
        await tx.user.upsert({
          where: { email: user.email },
          create: {
            id: userIds.get(user.id),
            name: user.name,
            email: user.email,
            passwordHash,
            phone: user.phone,
            city: user.city,
          },
          update: { name: user.name, phone: user.phone, city: user.city },
        });
      }

      const usedDemoStoreSlugs = new Set<string>();
      for (const seller of seedUsers.filter((user) =>
        seedProducts.some((product) => product.seller.id === user.id),
      )) {
        const sellerId = userIds.get(seller.id)!;
        const slug = createDemoStoreSlug(seller.name, usedDemoStoreSlugs);
        await tx.sellerProfile.upsert({
          where: { userId: sellerId },
          create: {
            userId: sellerId,
            storeName: seller.name,
            slug,
            description: "",
            city: seller.city,
            province: null,
          },
          update: {
            storeName: seller.name,
            city: seller.city || "Belum diatur",
          },
        });
      }

      for (const product of seedProducts) {
        const productId = productIds.get(product.id)!;
        const categoryId = categoryIds.get(product.category.slug)!;
        await tx.product.upsert({
          where: { id: productId },
          create: {
            id: productId,
            sellerId: userIds.get(product.seller.id)!,
            categoryId,
            title: product.title,
            description: product.description,
            price: product.price,
            condition: product.condition,
            status: product.status,
            city: product.city,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt),
          },
          update: {
            sellerId: userIds.get(product.seller.id)!,
            categoryId,
            title: product.title,
            description: product.description,
            price: product.price,
            condition: product.condition,
            status: product.status,
            city: product.city,
            updatedAt: new Date(product.updatedAt),
          },
        });
        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productImage.createMany({
          data: product.images.map((image) => ({
            productId,
            storageKey: `seed/${productId}/${image.position}.svg`,
            url: `http://localhost:3000${image.url}`,
            position: image.position,
          })),
        });
      }

      const favoriteSeeds = [
        ["u-buyer", "p1"],
        ["u-buyer", "p5"],
        ["u-seller", "p10"],
        ["u-extra", "p2"],
      ];
      for (const [userKey, productKey] of favoriteSeeds) {
        await tx.favorite.upsert({
          where: {
            userId_productId: {
              userId: userIds.get(userKey)!,
              productId: productIds.get(productKey)!,
            },
          },
          create: {
            userId: userIds.get(userKey)!,
            productId: productIds.get(productKey)!,
          },
          update: {},
        });
      }

      for (const order of seedOrders) {
        const buyer = demoUsers.find((user) => user.id === order.buyerId)!;
        await tx.order.upsert({
          where: { orderCode: order.orderCode },
          create: {
            id: orderIds.get(order.id),
            orderCode: order.orderCode,
            buyerId: userIds.get(order.buyerId)!,
            sellerId: userIds.get(order.sellerId)!,
            productId: productIds.get(order.productId)!,
            priceAtOrder: order.priceAtOrder,
            productTitleSnapshot: order.productTitleSnapshot,
            status: order.status,
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone ?? buyer.phone!,
            shippingAddress:
              order.shippingAddress ?? `Alamat demo, ${buyer.city}`,
            note: order.note,
            cancelReason: order.cancelReason,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          },
          update: {
            status: order.status,
            cancelReason: order.cancelReason,
            updatedAt: new Date(order.updatedAt),
          },
        });
      }
    });
    console.info(
      `Seed selesai untuk ${environment}: ${categories.length} kategori, ${demoUsers.length} user, ${seedProducts.length} produk, ${seedOrders.length} pesanan.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Seed gagal.",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
