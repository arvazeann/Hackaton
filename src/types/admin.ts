export type AdminPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUserDTO = {
  id: string;
  name: string;
  emailMasked: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  isOnline: boolean;
};

export type AdminProductDTO = {
  id: string;
  title: string;
  price: number;
  status: "active" | "reserved" | "sold" | "archived";
  category: string;
  seller: { id: string; name: string };
  createdAt: string;
};

export type AdminOrderDTO = {
  id: string;
  orderCode: string;
  productTitle: string;
  price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  createdAt: string;
};

export type AdminAddressDTO = {
  id: string;
  kind: "SHIPPING" | "PICKUP";
  label: string;
  city: string;
  province: string;
  isDefault: boolean;
  createdAt: string;
  owner: { id: string; name: string };
};

export type AdminOverviewDTO = {
  users: {
    total: number;
    registeredLast7Days: number;
    registeredLast30Days: number;
    onlineApproximate: number;
    activeLast7Days: number;
  };
  productsByStatus: Record<AdminProductDTO["status"], number>;
  ordersByStatus: Record<AdminOrderDTO["status"], number>;
  latestUsers: Pick<
    AdminUserDTO,
    "id" | "name" | "emailMasked" | "createdAt"
  >[];
  latestOrders: Pick<
    AdminOrderDTO,
    "id" | "orderCode" | "productTitle" | "status" | "createdAt"
  >[];
};
