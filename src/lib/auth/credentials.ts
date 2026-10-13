import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/schemas";

export async function authorizeCredentials(credentials: unknown) {
  const values =
    typeof credentials === "object" && credentials !== null ? credentials : {};
  const parsed = loginSchema.safeParse({
    email: "email" in values ? values.email : undefined,
    password: "password" in values ? values.password : undefined,
  });
  if (!parsed.success) return null;

  const email = parsed.data.email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash)))
    return null;

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: { id: true },
  });

  return { id: user.id, name: user.name, email: user.email };
}
