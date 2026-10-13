import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  getCurrentUser: vi.fn(),
  recordCurrentUserActivity: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("../../../auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
  recordCurrentUserActivity: mocks.recordCurrentUserActivity,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  AdminAuthorizationError,
  requireAdminActor,
  requireAdminRequest,
} from "@/server/admin/authorization";

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: adminId } });
  mocks.findUnique.mockResolvedValue({ id: adminId, role: "ADMIN" });
  mocks.recordCurrentUserActivity.mockResolvedValue(undefined);
});

describe("admin authorization", () => {
  it("requires an authenticated session and a fresh database ADMIN role", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(requireAdminActor()).rejects.toMatchObject({ status: 401 });
    expect(mocks.findUnique).not.toHaveBeenCalled();

    mocks.auth.mockResolvedValue({ user: { id: adminId } });
    mocks.findUnique.mockResolvedValue({ id: adminId, role: "USER" });
    await expect(requireAdminActor()).rejects.toBeInstanceOf(
      AdminAuthorizationError,
    );
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: adminId },
      select: { id: true, role: true },
    });
  });

  it("records activity only after the request is authenticated and authorized as ADMIN", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const anonymous = await requireAdminRequest();
    expect(anonymous).toBeInstanceOf(Response);
    expect((anonymous as Response).status).toBe(401);
    expect(mocks.recordCurrentUserActivity).not.toHaveBeenCalled();

    mocks.getCurrentUser.mockResolvedValue({
      id: adminId,
      platformRole: "USER",
    });
    const forbidden = await requireAdminRequest();
    expect(forbidden).toBeInstanceOf(Response);
    expect((forbidden as Response).status).toBe(403);
    expect(mocks.recordCurrentUserActivity).not.toHaveBeenCalled();

    mocks.getCurrentUser.mockResolvedValue({
      id: adminId,
      platformRole: "ADMIN",
    });
    await expect(requireAdminRequest()).resolves.toEqual({ id: adminId });
    expect(mocks.recordCurrentUserActivity).toHaveBeenCalledWith(adminId);
  });
});
