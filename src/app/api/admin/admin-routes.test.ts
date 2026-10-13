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
  updateAdminUserName: vi.fn(),
  setAdminUserAccountState: vi.fn(),
  updateAdminProduct: vi.fn(),
  archiveAdminProduct: vi.fn(),
  cancelAdminPendingOrder: vi.fn(),
  listAdminAuditLogs: vi.fn(),
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
  listAdminAuditLogs: mocks.listAdminAuditLogs,
}));
vi.mock("@/server/services/admin-mutations", () => ({
  updateAdminUserName: mocks.updateAdminUserName,
  setAdminUserAccountState: mocks.setAdminUserAccountState,
  updateAdminProduct: mocks.updateAdminProduct,
  archiveAdminProduct: mocks.archiveAdminProduct,
  cancelAdminPendingOrder: mocks.cancelAdminPendingOrder,
}));

import { GET as overview } from "@/app/api/admin/overview/route";
import { GET as users } from "@/app/api/admin/users/route";
import { GET as products } from "@/app/api/admin/products/route";
import { GET as orders } from "@/app/api/admin/orders/route";
import { GET as addresses } from "@/app/api/admin/addresses/route";
import { POST as reveal } from "@/app/api/admin/users/[id]/reveal-email/route";
import { PATCH as updateUser } from "@/app/api/admin/users/[id]/route";
import { POST as accountState } from "@/app/api/admin/users/[id]/account-state/route";
import { PATCH as updateProduct } from "@/app/api/admin/products/[id]/route";
import { POST as archiveProduct } from "@/app/api/admin/products/[id]/archive/route";
import { POST as cancelOrder } from "@/app/api/admin/orders/[id]/cancel/route";
import { GET as auditLogs } from "@/app/api/admin/audit-logs/route";

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
      updateUser(request, {
        params: Promise.resolve({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      }),
      accountState(request, {
        params: Promise.resolve({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      }),
      updateProduct(request, {
        params: Promise.resolve({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      }),
      archiveProduct(request, {
        params: Promise.resolve({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      }),
      cancelOrder(request, {
        params: Promise.resolve({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      }),
      auditLogs(request),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      403, 403, 403, 403, 403, 403, 403, 403, 403, 403, 403, 403,
    ]);
    expect(mocks.requireAdminRequest).toHaveBeenCalledTimes(12);
    expect(mocks.getAdminOverview).not.toHaveBeenCalled();
    expect(mocks.listAdminUsers).not.toHaveBeenCalled();
    expect(mocks.listAdminProducts).not.toHaveBeenCalled();
    expect(mocks.listAdminOrders).not.toHaveBeenCalled();
    expect(mocks.listAdminAddresses).not.toHaveBeenCalled();
    expect(mocks.revealAdminUserEmail).not.toHaveBeenCalled();
    expect(mocks.updateAdminUserName).not.toHaveBeenCalled();
    expect(mocks.setAdminUserAccountState).not.toHaveBeenCalled();
    expect(mocks.updateAdminProduct).not.toHaveBeenCalled();
    expect(mocks.archiveAdminProduct).not.toHaveBeenCalled();
    expect(mocks.cancelAdminPendingOrder).not.toHaveBeenCalled();
    expect(mocks.listAdminAuditLogs).not.toHaveBeenCalled();
  });
});
