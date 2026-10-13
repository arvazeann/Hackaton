import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, redirect, updateMany, headers } = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  updateMany: vi.fn(),
  headers: vi.fn(),
}));
vi.mock("../../auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({ headers }));
vi.mock("@/lib/db", () => ({ db: { user: { updateMany } } }));

import { getCurrentUser, requireCurrentUser } from "./session";

describe("getCurrentUser", () => {
  beforeEach(() => {
    auth.mockReset();
    updateMany.mockReset().mockResolvedValue({ count: 1 });
    headers.mockReset().mockResolvedValue(new Headers());
    redirect.mockReset().mockImplementation((path: string): never => {
      throw new Error(`REDIRECT:${path}`);
    });
  });

  it("returns null without a session", async () => {
    auth.mockResolvedValue(null);
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("redirects unauthenticated users to login with their return path", async () => {
    auth.mockResolvedValue(null);
    await expect(requireCurrentUser("/products/new?draft=1")).rejects.toThrow(
      "REDIRECT:/login?callbackUrl=%2Fproducts%2Fnew%3Fdraft%3D1",
    );
  });

  it("returns only the client-safe identity fields", async () => {
    auth.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Ayu",
        email: "ayu@example.test",
        role: "USER",
        passwordHash: "must-not-escape",
        phone: "08123456789",
      },
    });
    const user = await getCurrentUser();
    expect(user).toEqual({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
      city: "",
      platformRole: "USER",
    });
    expect(JSON.stringify(user)).not.toContain("passwordHash");
    expect(JSON.stringify(user)).not.toContain("08123456789");
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "user-1",
          OR: [
            { lastActiveAt: null },
            { lastActiveAt: { lte: expect.any(Date) } },
          ],
        },
        data: { lastActiveAt: expect.any(Date) },
      }),
    );
  });

  it("does not record activity for missing identity or role", async () => {
    auth.mockResolvedValue({ user: { id: "user-1", email: "a@example.test" } });
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("skips prefetched page requests", async () => {
    auth.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Ayu",
        email: "ayu@example.test",
        role: "USER",
      },
    });
    headers.mockResolvedValue(new Headers({ "next-router-prefetch": "1" }));
    await getCurrentUser();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("uses an atomic five-minute predicate so concurrent requests do not keep extending activity", async () => {
    auth.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Ayu",
        email: "ayu@example.test",
        role: "USER",
      },
    });
    let lastActiveAt: Date | null = null;
    updateMany.mockImplementation(
      async (args: {
        where: { OR: { lastActiveAt?: null | { lte: Date } }[] };
        data: { lastActiveAt: Date };
      }) => {
        const cutoff = args.where.OR[1]?.lastActiveAt;
        const eligible =
          lastActiveAt === null ||
          (typeof cutoff === "object" &&
            cutoff !== null &&
            lastActiveAt <= cutoff.lte);
        if (!eligible) return { count: 0 };
        lastActiveAt = args.data.lastActiveAt;
        return { count: 1 };
      },
    );
    await Promise.all([getCurrentUser(), getCurrentUser()]);
    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(lastActiveAt).toBeInstanceOf(Date);
  });
});
