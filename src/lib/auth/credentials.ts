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
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash)))
    return null;

  return { id: user.id, name: user.name, email: user.email };
}
