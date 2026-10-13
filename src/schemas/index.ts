import { z } from "zod";
import { PRODUCT_IMAGE_KEY_PATTERN } from "@/lib/product-images";
const id = z.string().min(1, "Pilih kategori yang valid.");
export const productQuerySchema = z
  .object({
    q: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    condition: z.enum(["like_new", "good", "fair"]).optional(),
    city: z.string().optional(),
    sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .transform((value) => Math.min(value, 48))
      .default(12),
  })
  .strict();
export const productSchema = z
  .object({
    title: z
      .string()
      .min(3, "Judul minimal 3 karakter.")
      .max(150, "Judul maksimal 150 karakter."),
    description: z
      .string()
      .min(1, "Deskripsi wajib diisi.")
      .max(5000, "Deskripsi maksimal 5000 karakter."),
    price: z
      .number()
      .int()
      .positive("Harga harus lebih dari Rp0.")
      .max(1_000_000_000, "Harga maksimal Rp1.000.000.000."),
    categoryId: id,
    condition: z.enum(["like_new", "good", "fair"]),
    city: z.string().min(1, "Kota wajib diisi."),
    images: z
      .array(
        z
          .object({
            storageKey: z
              .string()
              .regex(PRODUCT_IMAGE_KEY_PATTERN, "Foto produk tidak valid."),
            position: z.number().int().min(0).max(4),
          })
          .strict(),
      )
      .min(1, "Tambahkan minimal satu foto.")
      .max(5, "Maksimal lima foto."),
  })
  .strict();
export const orderSchema = z
  .object({
    shippingName: z.string().trim().min(1, "Nama penerima wajib diisi."),
    shippingPhone: z.string().trim().min(8, "Nomor telepon minimal 8 digit."),
    shippingAddress: z.string().trim().min(1, "Alamat wajib diisi."),
    note: z.string().optional(),
  })
  .strict();
export const createOrderSchema = orderSchema
  .extend({ productId: z.uuid("Produk tidak valid.") })
  .strict();
export const favoriteSchema = z
  .object({ productId: z.uuid("Produk tidak valid.") })
  .strict();
export const notificationTypeSchema = z.enum([
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "ORDER_REJECTED",
  "ORDER_CANCELLED",
  "ORDER_COMPLETED",
]);
export const notificationDtoSchema = z
  .object({
    id: z.uuid(),
    type: notificationTypeSchema,
    orderId: z.uuid().nullable(),
    title: z.string(),
    body: z.string(),
    readAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
  })
  .strict();
export const notificationPreferenceSchema = z
  .object({
    preferences: z
      .array(
        z
          .object({
            type: notificationTypeSchema,
            enabled: z.boolean(),
          })
          .strict(),
      )
      .length(5),
  })
  .strict();
export const notificationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .transform((value) => Math.min(value, 48))
      .default(12),
  })
  .strict();
export const publicStoreProductSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    price: z.number().int(),
    condition: z.enum(["like_new", "good", "fair"]),
    city: z.string(),
    status: z.enum(["active", "reserved", "sold", "archived"]),
    coverImageUrl: z.string(),
    category: z
      .object({ id: z.string(), name: z.string(), slug: z.string() })
      .strict(),
    seller: z
      .object({
        id: z.uuid(),
        name: z.string(),
        storeSlug: z.string().nullable(),
      })
      .strict(),
    isFavorited: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .strict();
export const publicStoreDtoSchema = z
  .object({
    storeName: z.string(),
    slug: z.string(),
    description: z.string(),
    logoUrl: z.string().nullable(),
    city: z.string(),
    province: z.string().nullable(),
    joinedAt: z.iso.datetime(),
    completedSales: z.number().int().nonnegative(),
    isOnVacation: z.boolean(),
    products: z.array(publicStoreProductSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive().max(48),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const storeVacationSchema = z
  .object({ isOnVacation: z.boolean() })
  .strict();
export const orderStatusSchema = z
  .object({
    orderId: z.uuid("Pesanan tidak valid."),
    action: z.enum(["confirm", "reject", "cancel", "complete"]),
    reason: z.string().trim().optional(),
    paymentAccountId: z.uuid().optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (
      v.action === "cancel" &&
      (!v.reason || v.reason.length < 5 || v.reason.length > 500)
    )
      c.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Alasan pembatalan wajib 5–500 karakter.",
      });
  });
export const loginSchema = z
  .object({
    email: z.string().trim().email("Masukkan email yang valid."),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  })
  .strict();
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter."),
    email: z.string().trim().email("Masukkan email yang valid."),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  })
  .strict();
export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .strict()
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak cocok.",
  });
export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(100, "Nama maksimal 100 karakter."),
    phone: z
      .string()
      .trim()
      .min(8, "Nomor telepon minimal 8 digit.")
      .max(20, "Nomor telepon maksimal 20 karakter."),
    city: z
      .string()
      .trim()
      .min(1, "Kota wajib diisi.")
      .max(100, "Kota maksimal 100 karakter."),
    bio: z.string().trim().max(300, "Bio maksimal 300 karakter."),
    avatarKey: z
      .string()
      .regex(/^[0-9a-f-]{36}\.(jpg|png|webp)$/i)
      .nullable(),
  })
  .strict();
export const addressSchema = z
  .object({
    id: z.uuid().optional(),
    kind: z.enum(["SHIPPING", "PICKUP"]),
    label: z.string().trim().min(1).max(60),
    contactName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(8).max(20),
    street: z.string().trim().min(1).max(2000),
    city: z.string().trim().min(1).max(100),
    province: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(12),
    isDefault: z.boolean().default(false),
  })
  .strict();
export const storeProfileSchema = z
  .object({
    storeName: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500),
    logoKey: z
      .string()
      .regex(/^[0-9a-f-]{36}\.(jpg|png|webp)$/i)
      .nullable(),
    city: z.string().trim().min(1).max(100),
    province: z.string().trim().min(1).max(100),
  })
  .strict();
export const paymentAccountSchema = z
  .object({
    id: z.uuid().optional(),
    type: z.enum(["BANK", "EWALLET"]),
    providerName: z.string().trim().min(1).max(100),
    accountNumber: z.string().trim().min(3).max(64),
    accountHolderName: z.string().trim().min(1).max(100),
  })
  .strict();
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  })
  .strict();
export const cancelReasonSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(5, "Alasan pembatalan minimal 5 karakter.")
      .max(500, "Alasan pembatalan maksimal 500 karakter."),
  })
  .strict();

const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
const adminSearchSchema = z.string().trim().max(120).optional();
export const adminUserQuerySchema = adminPaginationSchema
  .extend({
    q: adminSearchSchema,
    role: z.enum(["USER", "ADMIN"]).optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
  })
  .strict();
export const adminProductQuerySchema = adminPaginationSchema
  .extend({
    q: adminSearchSchema,
    status: z.enum(["active", "reserved", "sold", "archived"]).optional(),
    category: z.string().trim().max(80).optional(),
  })
  .strict();
export const adminOrderQuerySchema = adminPaginationSchema
  .extend({
    q: z.string().trim().max(24).optional(),
    status: z
      .enum(["pending", "confirmed", "completed", "cancelled", "rejected"])
      .optional(),
    identityId: z.uuid().optional(),
  })
  .strict();
export const adminAddressQuerySchema = adminPaginationSchema
  .extend({
    q: adminSearchSchema,
    kind: z.enum(["SHIPPING", "PICKUP"]).optional(),
    city: z.string().trim().max(100).optional(),
    province: z.string().trim().max(100).optional(),
  })
  .strict();
export const adminRevealEmailSchema = z.object({ userId: z.uuid() }).strict();
