import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const { findUnique, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique, update } } }));

import { authorizeCredentials } from "@/lib/auth/credentials";

describe("Auth.js Credentials", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset().mockResolvedValue({ id: "user-1" });
  });

  it("melakukan normalisasi email, memverifikasi password, dan hanya mengembalikan DTO aman", async () => {
    const passwordHash = await bcrypt.hash("password-valid", 4);
    findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
      passwordHash,
      disabledAt: null,
      sessionVersion: 4,
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
      sessionVersion: 4,
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: "ayu@example.test" },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        disabledAt: true,
        sessionVersion: true,
      },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { lastLoginAt: expect.any(Date) },
      }),
    );
  });

  it("menolak password salah, pengguna tidak dikenal, dan input invalid", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
      passwordHash: await bcrypt.hash("password-valid", 4),
      disabledAt: null,
      sessionVersion: 0,
    });
    await expect(
      authorizeCredentials({
        email: "ayu@example.test",
        password: "wrong-pass",
      }),
    ).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
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

  it("menolak akun nonaktif walaupun password cocok", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
      passwordHash: await bcrypt.hash("password-valid", 4),
      disabledAt: new Date(),
      sessionVersion: 1,
    });
    await expect(
      authorizeCredentials({
        email: "ayu@example.test",
        password: "password-valid",
      }),
    ).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
  });
});
