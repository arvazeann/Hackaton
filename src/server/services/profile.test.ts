import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  uploadedFile: { findFirst: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db: prisma }));

import { getProfile, updateProfile } from "@/server/services/profile";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const profile = {
  id,
  name: "Raka",
  email: "raka@example.id",
  phone: null,
  city: null,
};

beforeEach(() => vi.clearAllMocks());

describe("profile Prisma service", () => {
  it("reads only the requested account's safe profile fields and maps nullable fields", async () => {
    prisma.user.findUnique.mockResolvedValue(profile);
    expect(await getProfile(id)).toEqual({
      ...profile,
      phone: null,
      city: "",
      bio: "",
      avatarKey: null,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        bio: true,
        avatarKey: true,
      },
    });
    expect(await getProfile("u-buyer")).toBeNull();
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("updates an allowlisted profile for the session account only", async () => {
    prisma.user.update.mockResolvedValue({
      ...profile,
      name: "Raka Pratama",
      phone: "081234567890",
      city: "Bandung",
    });
    const result = await updateProfile(
      {
        name: "Raka Pratama",
        phone: "081234567890",
        city: "Bandung",
        bio: "",
        avatarKey: null,
      },
      id,
    );
    expect(result).toMatchObject({
      success: true,
      data: { id, name: "Raka Pratama", city: "Bandung" },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id },
      data: {
        name: "Raka Pratama",
        phone: "081234567890",
        city: "Bandung",
        bio: "",
        avatarKey: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        bio: true,
        avatarKey: true,
      },
    });
    expect(JSON.stringify(result)).not.toContain("passwordHash");
  });

  it("rejects missing session and disallowed identity or private fields", async () => {
    const input = {
      name: "Raka",
      phone: "081234567890",
      city: "Bandung",
      bio: "",
      avatarKey: null,
    };
    expect(await updateProfile(input, null)).toMatchObject({
      success: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(
      await updateProfile({ ...input, id: "another-user" }, id),
    ).toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(
      await updateProfile({ ...input, passwordHash: "private" }, id),
    ).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns not found for a deleted account and rejects values beyond database limits", async () => {
    prisma.user.update.mockRejectedValueOnce({ code: "P2025" });
    expect(
      await updateProfile(
        {
          name: "Raka",
          phone: "081234567890",
          city: "Bandung",
          bio: "",
          avatarKey: null,
        },
        id,
      ),
    ).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
    expect(
      await updateProfile(
        {
          name: "R".repeat(101),
          phone: "081234567890",
          city: "Bandung",
        },
        id,
      ),
    ).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });
});
