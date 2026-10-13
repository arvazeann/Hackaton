import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const { create, findUnique, update } = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { user: { create, findUnique, update } },
}));

import { resolveGoogleUser } from "@/lib/auth/google-account";

describe("resolveGoogleUser", () => {
  beforeEach(() => {
    create.mockReset();
    findUnique.mockReset();
    update.mockReset();
  });

  it("requires Google's email verification before looking up an account", async () => {
    await expect(
      resolveGoogleUser({
        email: "person@example.test",
        email_verified: false,
        name: "Person",
      }),
    ).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("links an enabled local account by normalized, verified email", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      sessionVersion: 3,
      disabledAt: null,
    });
    update.mockResolvedValue({
      id: "user-1",
      sessionVersion: 3,
      disabledAt: null,
    });

    await expect(
      resolveGoogleUser({
        email: " PERSON@Example.test ",
        email_verified: true,
        name: "Person",
      }),
    ).resolves.toMatchObject({ id: "user-1", sessionVersion: 3 });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "person@example.test" } }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } }),
    );
  });

  it("denies disabled accounts", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      sessionVersion: 4,
      disabledAt: new Date(),
    });

    await expect(
      resolveGoogleUser({
        email: "person@example.test",
        email_verified: true,
      }),
    ).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a USER account with an unusable random bcrypt password", async () => {
    findUnique.mockResolvedValue(null);
    create.mockImplementation(async ({ data }) => ({
      id: "new-user",
      sessionVersion: 0,
      disabledAt: null,
      storedHash: data.passwordHash,
    }));

    const user = await resolveGoogleUser({
      email: "new@example.test",
      email_verified: true,
      name: "New User",
    });

    expect(user).toMatchObject({ id: "new-user", sessionVersion: 0 });
    const data = create.mock.calls[0]?.[0]?.data as {
      email: string;
      name: string;
      passwordHash: string;
    };
    expect(data).toMatchObject({ email: "new@example.test", name: "New User" });
    expect(data.passwordHash).not.toContain("new@example.test");
    expect(bcrypt.getRounds(data.passwordHash)).toBe(12);
    await expect(bcrypt.compare("", data.passwordHash)).resolves.toBe(false);
  });
});
