import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique } } }));

import { authorizeCredentials } from "@/lib/auth/credentials";

describe("Auth.js Credentials", () => {
  beforeEach(() => findUnique.mockReset());

  it("melakukan normalisasi email, memverifikasi password, dan hanya mengembalikan DTO aman", async () => {
    const passwordHash = await bcrypt.hash("password-valid", 4);
    findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
      passwordHash,
      phone: "08123456789",
    });

    await expect(
      authorizeCredentials({
        email: " AYU@example.test ",
        password: "password-valid",
        csrfToken: "ignored-authjs-field",
        callbackUrl: "/",
      }),
    ).resolves.toEqual({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: "ayu@example.test" },
    });
  });

  it("menolak password salah, pengguna tidak dikenal, dan input invalid", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
      passwordHash: await bcrypt.hash("password-valid", 4),
    });
    await expect(
      authorizeCredentials({
        email: "ayu@example.test",
        password: "wrong-pass",
      }),
    ).resolves.toBeNull();
    findUnique.mockResolvedValue(null);
    await expect(
      authorizeCredentials({
        email: "missing@example.test",
        password: "password-valid",
      }),
    ).resolves.toBeNull();
    await expect(
      authorizeCredentials({ email: "bad", password: "x" }),
    ).resolves.toBeNull();
  });
});
