export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EMAIL_TAKEN"
  | "PRODUCT_NOT_AVAILABLE"
  | "INVALID_STATUS_TRANSITION"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";
export type ActionResult<TData> =
  | { success: true; data: TData }
  | {
      success: false;
      error: {
        code: ErrorCode;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
export type ProductStatus = "active" | "reserved" | "sold" | "archived";
export type Condition = "like_new" | "good" | "fair";
export type OrderStatus =
  "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
export type User = {
  id: string;
  name: string;
  email: string;
  city: string;
  platformRole?: "USER" | "ADMIN";
  phone?: string | null;
  bio?: string | null;
  avatarKey?: string | null;
};
export type AddressDTO = {
  id: string;
  kind: "SHIPPING" | "PICKUP";
  label: string;
  contactName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};
export type StoreProfileDTO = {
  storeName: string;
  slug: string;
  description: string;
  logoKey: string | null;
  city: string;
  province: string | null;
  needsCompletion: boolean;
  isOnVacation: boolean;
};
export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_REJECTED"
  | "ORDER_CANCELLED"
  | "ORDER_COMPLETED";
export type NotificationDTO = {
  id: string;
  type: NotificationType;
  orderId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};
export type NotificationPreferenceDTO = {
  type: NotificationType;
  enabled: boolean;
};
export type PublicStoreDTO = {
  storeName: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  city: string;
  province: string | null;
  joinedAt: string;
  completedSales: number;
  isOnVacation: boolean;
  products: ProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
export type PaymentAccountDTO = {
  id: string;
  type: "BANK" | "EWALLET";
  providerName: string;
  accountNumberLast4: string;
  accountHolderName: string;
  isActive: boolean;
};
export type PaymentInstruction = {
  providerName: string;
  accountHolderName: string;
  accountNumber: string;
};
export type Category = { id: string; name: string; slug: string };
export type ProductListItem = {
  id: string;
  title: string;
  price: number;
  condition: Condition;
  city: string;
  status: ProductStatus;
  coverImageUrl: string;
  category: Category;
  seller: {
    id: string;
    name: string;
    storeSlug?: string | null;
    isOnVacation?: boolean;
  };
  isFavorited: boolean;
  createdAt: string;
};
export type ProductDetail = ProductListItem & {
  description: string;
  images: {
    id: string;
    url: string;
    position: number;
    storageKey?: string;
  }[];
  seller: {
    id: string;
    name: string;
    city: string;
    storeSlug: string | null;
    isOnVacation: boolean;
  };
  updatedAt: string;
};
export type OrderDTO = {
  id: string;
  orderCode: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  productTitleSnapshot: string;
  priceAtOrder: number;
  status: OrderStatus;
  shippingName: string;
  shippingPhone: string | null;
  shippingAddress: string | null;
  note: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  paymentInstruction: PaymentInstruction | null;
  paymentAccountNumberLast4: string | null;
};
