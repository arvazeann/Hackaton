import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { loginSchema } from "@/schemas";

type GoogleProfileInput = {
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
};

const googleUserSelect = {
  id: true,
  sessionVersion: true,
  disabledAt: true,
} as const;

async function findGoogleUser(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: googleUserSelect,
  });
  return user;
}

async function touchLastLogin(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
    select: googleUserSelect,
  });
}

/**
 * Google accounts are matched by Google's verified email because this project
 * intentionally has no OAuth Account table or Auth.js database adapter.
 */
export async function resolveGoogleUser(profile: GoogleProfileInput) {
  if (profile.email_verified !== true || typeof profile.email !== "string")
    return null;

  const email = profile.email.trim().toLowerCase();
  if (!loginSchema.shape.email.safeParse(email).success) return null;

  const existing = await findGoogleUser(email);
  if (existing) {
    if (existing.disabledAt) return null;
    return touchLastLogin(existing.id);
  }

  const profileName =
    typeof profile.name === "string" ? profile.name.trim() : "";
  const emailName = email.split("@")[0] ?? "";
  const name = (
    profileName || (emailName.length >= 2 ? emailName : "Pengguna RuangLagi")
  )
    .slice(0, 100)
    .trim();
  const passwordHash = await bcrypt.hash(
    randomBytes(32).toString("base64url"),
    12,
  );

  try {
    return await db.user.create({
      data: { email, name, passwordHash, lastLoginAt: new Date() },
      select: googleUserSelect,
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    const racedUser = await findGoogleUser(email);
    return racedUser && !racedUser.disabledAt
      ? touchLastLogin(racedUser.id)
      : null;
  }
}
