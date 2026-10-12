import bcrypt from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  addressSchema,
  paymentAccountSchema,
  passwordChangeSchema,
  storeProfileSchema,
} from "@/schemas";
import {
  encryptPaymentData,
  lastFour,
} from "@/server/security/payment-encryption";
import { ownsUploadedFile } from "@/server/services/uploaded-files";
import type { AddressDTO, PaymentAccountDTO, StoreProfileDTO } from "@/types";

const reservedSlugs = new Set([
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

export async function hasPendingOrdersWithoutPaymentAccount(userId: string) {
  const [pendingOrders, activeAccounts] = await Promise.all([
    db.order.count({ where: { sellerId: userId, status: "pending" } }),
    db.paymentAccount.count({
      where: { sellerProfileId: userId, isActive: true },
    }),
  ]);
  return pendingOrders > 0 && activeAccounts === 0;
}

const slugBase = (name: string) => {
  const slug =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "toko";
  return reservedSlugs.has(slug) ? `${slug}-store` : slug;
};
async function uniqueSlug(name: string, tx: Prisma.TransactionClient) {
  const base = slugBase(name);
  let slug = base;
  let suffix = 2;
  while (
    await tx.sellerProfile.findUnique({
      where: { slug },
      select: { userId: true },
    })
  ) {
    slug = `${base.slice(0, 120 - String(suffix).length - 1)}-${suffix++}`;
  }
  return slug;
}
function addressDto(row: AddressDTO): AddressDTO {
  return row;
}
function paymentDto(row: {
  id: string;
  type: "BANK" | "EWALLET";
  providerName: string;
  accountNumberLast4: string;
  accountHolderName: string;
  isActive: boolean;
}): PaymentAccountDTO {
  return {
    id: row.id,
    type: row.type,
    providerName: row.providerName,
    accountNumberLast4: row.accountNumberLast4,
    accountHolderName: row.accountHolderName,
    isActive: row.isActive,
  };
}

export async function getProfileHub(userId: string) {
  const [
    user,
    addresses,
    store,
    paymentAccounts,
    buyerActiveOrders,
    recentOrders,
    sellerPendingOrders,
    productsByStatus,
    completedSales,
    revenue,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        bio: true,
        avatarKey: true,
      },
    }),
    db.address.findMany({
      where: { userId },
      orderBy: [{ kind: "asc" }, { isDefault: "desc" }, { createdAt: "desc" }],
    }),
    db.sellerProfile.findUnique({ where: { userId } }),
    db.paymentAccount.findMany({
      where: { sellerProfileId: userId },
      orderBy: { createdAt: "desc" },
    }),
    db.order.count({
      where: { buyerId: userId, status: { in: ["pending", "confirmed"] } },
    }),
    db.order.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderCode: true,
        status: true,
        productTitleSnapshot: true,
        createdAt: true,
      },
    }),
    db.order.count({ where: { sellerId: userId, status: "pending" } }),
    db.product.groupBy({
      by: ["status"],
      where: { sellerId: userId },
      _count: { _all: true },
    }),
    db.order.count({ where: { sellerId: userId, status: "completed" } }),
    db.order.aggregate({
      where: { sellerId: userId, status: "completed" },
      _sum: { priceAtOrder: true },
    }),
  ]);
  if (!user) return null;
  const mappedStore: StoreProfileDTO | null = store
    ? {
        storeName: store.storeName,
        slug: store.slug,
        description: store.description,
        logoKey: store.logoKey,
        city: store.city,
        province: store.province,
        needsCompletion: !store.province,
      }
    : null;
  return {
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      bio: user.bio,
      avatarKey: user.avatarKey,
    },
    addresses: addresses.map(addressDto),
    store: mappedStore,
    paymentAccounts: paymentAccounts.map(paymentDto),
    buyer: { activeOrders: buyerActiveOrders, recentOrders },
    seller: store
      ? {
          pendingOrders: sellerPendingOrders,
          productsByStatus: Object.fromEntries(
            productsByStatus.map(({ status, _count }) => [status, _count._all]),
          ),
          completedSales,
          totalRevenue: revenue._sum.priceAtOrder ?? 0,
        }
      : null,
  };
}

export async function saveAddress(userId: string, input: unknown) {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, message: "Data alamat tidak valid." };
  try {
    const data = parsed.data;
    const address = await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
        const count = await tx.address.count({
          where: {
            userId,
            kind: data.kind,
            ...(data.id ? { id: { not: data.id } } : {}),
          },
        });
        const max = data.kind === "SHIPPING" ? 10 : 1;
        if (count >= max) throw new Error("ADDRESS_LIMIT");
        if (data.id) {
          const owned = await tx.address.findFirst({
            where: { id: data.id, userId },
            select: { id: true },
          });
          if (!owned) throw new Error("NOT_FOUND");
        }
        if (data.isDefault)
          await tx.address.updateMany({
            where: {
              userId,
              kind: data.kind,
              ...(data.id ? { id: { not: data.id } } : {}),
            },
            data: { isDefault: false },
          });
        const { id, ...values } = data;
        return id
          ? tx.address.update({ where: { id }, data: values })
          : tx.address.create({ data: { ...values, userId } });
      },
      { isolationLevel: "Serializable" },
    );
    return { ok: true as const, data: address };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "ADDRESS_LIMIT"
        ? "Batas alamat untuk jenis ini sudah tercapai."
        : "Alamat tidak dapat disimpan.";
    return { ok: false as const, message };
  }
}

export async function deleteAddress(userId: string, id: string) {
  const result = await db.address.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export async function saveStore(userId: string, input: unknown) {
  const parsed = storeProfileSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, message: "Data toko tidak valid." };
  const data = parsed.data;
  if (data.logoKey) {
    const owned = await ownsUploadedFile(data.logoKey, userId, "LOGO");
    if (!owned)
      return {
        ok: false as const,
        message: "Logo tidak dimiliki akun ini atau bukan unggahan logo.",
      };
  }
  try {
    const current = await db.sellerProfile.findUnique({ where: { userId } });
    let saved;
    if (current) {
      saved = await db.sellerProfile.update({ where: { userId }, data });
    } else {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          saved = await db.$transaction(async (tx) =>
            tx.sellerProfile.create({
              data: {
                ...data,
                userId,
                slug: await uniqueSlug(data.storeName, tx),
              },
            }),
          );
          break;
        } catch (error) {
          if (
            attempt === 3 ||
            !(
              typeof error === "object" &&
              error !== null &&
              "code" in error &&
              error.code === "P2002"
            )
          )
            throw error;
        }
      }
      if (!saved) throw new Error("STORE_CREATE_FAILED");
    }
    return {
      ok: true as const,
      data: {
        storeName: saved.storeName,
        slug: saved.slug,
        description: saved.description,
        logoKey: saved.logoKey,
        city: saved.city,
        province: saved.province,
        needsCompletion: !saved.province,
      } satisfies StoreProfileDTO,
    };
  } catch {
    return { ok: false as const, message: "Profil toko gagal disimpan." };
  }
}

export async function savePaymentAccount(userId: string, input: unknown) {
  const parsed = paymentAccountSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, message: "Data akun pembayaran tidak valid." };
  const data = parsed.data;
  try {
    const saved = await db.$transaction(
      async (tx) => {
        const store = await tx.sellerProfile.findUnique({
          where: { userId },
          select: { userId: true },
        });
        if (!store) throw new Error("STORE_REQUIRED");
        await tx.$queryRaw`SELECT user_id FROM seller_profiles WHERE user_id = ${userId}::uuid FOR UPDATE`;
        const numberCiphertext = encryptPaymentData(data.accountNumber);
        if (data.id) {
          const owned = await tx.paymentAccount.findFirst({
            where: { id: data.id, sellerProfileId: userId },
            select: { id: true },
          });
          if (!owned) throw new Error("NOT_FOUND");
          return tx.paymentAccount.update({
            where: { id: data.id },
            data: {
              type: data.type,
              providerName: data.providerName,
              accountNumberCiphertext: numberCiphertext,
              accountNumberLast4: lastFour(data.accountNumber),
              accountHolderName: data.accountHolderName,
            },
          });
        }
        const active = await tx.paymentAccount.count({
          where: { sellerProfileId: userId, isActive: true },
        });
        if (active >= 3) throw new Error("ACCOUNT_LIMIT");
        return tx.paymentAccount.create({
          data: {
            sellerProfileId: userId,
            type: data.type,
            providerName: data.providerName,
            accountNumberCiphertext: numberCiphertext,
            accountNumberLast4: lastFour(data.accountNumber),
            accountHolderName: data.accountHolderName,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    return { ok: true as const, data: paymentDto(saved) };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "ACCOUNT_LIMIT"
        ? "Maksimal tiga akun pembayaran aktif."
        : error instanceof Error && error.message === "STORE_REQUIRED"
          ? "Aktifkan toko terlebih dahulu."
          : "Akun pembayaran gagal disimpan.";
    return { ok: false as const, message };
  }
}

export async function deactivatePaymentAccount(userId: string, id: string) {
  const result = await db.paymentAccount.updateMany({
    where: { id, sellerProfileId: userId, isActive: true },
    data: { isActive: false },
  });
  return result.count > 0;
}

export async function changePassword(userId: string, input: unknown) {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      message: "Periksa kata sandi yang dimasukkan.",
    };
  const account = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (
    !account ||
    !(await bcrypt.compare(parsed.data.currentPassword, account.passwordHash))
  )
    return { ok: false as const, message: "Kata sandi saat ini tidak cocok." };
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  return { ok: true as const };
}
