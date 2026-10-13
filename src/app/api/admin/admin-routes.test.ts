import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminRequest: vi.fn(),
  adminErrorResponse: vi.fn(),
  getAdminOverview: vi.fn(),
  listAdminUsers: vi.fn(),
  listAdminProducts: vi.fn(),
  listAdminOrders: vi.fn(),
  listAdminAddresses: vi.fn(),
  revealAdminUserEmail: vi.fn(),
}));
vi.mock("@/server/admin/authorization", () => ({
  requireAdminRequest: mocks.requireAdminRequest,
  adminErrorResponse: mocks.adminErrorResponse,
}));
vi.mock("@/server/services/admin", () => ({
  getAdminOverview: mocks.getAdminOverview,
  listAdminUsers: mocks.listAdminUsers,
  listAdminProducts: mocks.listAdminProducts,
  listAdminOrders: mocks.listAdminOrders,
  listAdminAddresses: mocks.listAdminAddresses,
  revealAdminUserEmail: mocks.revealAdminUserEmail,
}));

import { GET as overview } from "@/app/api/admin/overview/route";
import { GET as users } from "@/app/api/admin/users/route";
import { GET as products } from "@/app/api/admin/products/route";
import { GET as orders } from "@/app/api/admin/orders/route";
import { GET as addresses } from "@/app/api/admin/addresses/route";
import { POST as reveal } from "@/app/api/admin/users/[id]/reveal-email/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdminRequest.mockResolvedValue(
    Response.json({ message: "Akses admin diperlukan." }, { status: 403 }),
  );
});

describe("admin Route Handler authorization", () => {
  it("denies a non-admin at every admin endpoint before calling a service", async () => {
    const request = new Request("http://localhost/api/admin/users");
    const responses = await Promise.all([
      overview(),
      users(request),
      products(request),
      orders(request),
      addresses(request),
      reveal(request, {
        params: Promise.resolve({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      403, 403, 403, 403, 403, 403,
    ]);
    expect(mocks.requireAdminRequest).toHaveBeenCalledTimes(6);
    expect(mocks.getAdminOverview).not.toHaveBeenCalled();
    expect(mocks.listAdminUsers).not.toHaveBeenCalled();
    expect(mocks.listAdminProducts).not.toHaveBeenCalled();
    expect(mocks.listAdminOrders).not.toHaveBeenCalled();
    expect(mocks.listAdminAddresses).not.toHaveBeenCalled();
    expect(mocks.revealAdminUserEmail).not.toHaveBeenCalled();
  });
});
