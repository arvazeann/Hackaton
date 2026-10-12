import { db } from "@/lib/db";
import { profileSchema } from "@/schemas";
import type { ActionResult, User } from "@/types";
import { ownsUploadedFile } from "@/server/services/uploaded-files";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const fail = <T = never>(
  code: "UNAUTHENTICATED" | "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR",
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> => ({
  success: false,
  error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) },
});

const ok = <T>(data: T): ActionResult<T> => ({ success: true, data });

type ProfileRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  bio?: string | null;
  avatarKey?: string | null;
};

function mapProfile(user: ProfileRecord): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city ?? "",
    bio: user.bio ?? "",
    avatarKey: user.avatarKey ?? null,
  };
}

function prismaCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error)
    return typeof error.code === "string" ? error.code : undefined;
  return undefined;
}

export async function getProfile(userId: string): Promise<User | null> {
  if (!isUuid(userId)) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
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
  return user ? mapProfile(user) : null;
}

export async function updateProfile(
  rawInput: unknown,
  userId: string | null,
): Promise<ActionResult<User>> {
  if (!userId || !isUuid(userId))
    return fail("UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  const parsed = profileSchema.safeParse(rawInput);
  if (!parsed.success)
    return fail(
      "VALIDATION_ERROR",
      "Periksa kembali data profil.",
      parsed.error.flatten().fieldErrors,
    );
  try {
    if (parsed.data.avatarKey) {
      const uploaded = await ownsUploadedFile(
        parsed.data.avatarKey,
        userId,
        "AVATAR",
      );
      if (!uploaded)
        return fail(
          "VALIDATION_ERROR",
          "Avatar bukan unggahan milik akun ini.",
        );
    }
    const user = await db.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        city: parsed.data.city,
        bio: parsed.data.bio,
        avatarKey: parsed.data.avatarKey,
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
    return ok(mapProfile(user));
  } catch (error) {
    if (prismaCode(error) === "P2025")
      return fail("NOT_FOUND", "Akun tidak ditemukan.");
    return fail("INTERNAL_ERROR", "Profil gagal diperbarui.");
  }
}
