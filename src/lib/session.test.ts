import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, redirect } = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("../../auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));

import { getCurrentUser, requireCurrentUser } from "./session";

describe("getCurrentUser", () => {
  beforeEach(() => {
    auth.mockReset();
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
    });
    expect(JSON.stringify(user)).not.toContain("passwordHash");
    expect(JSON.stringify(user)).not.toContain("08123456789");
  });
});
