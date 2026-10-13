import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const bootstrapInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128),
  })
  .strict();

export class AdminBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminBootstrapError";
  }
}

export async function promoteExistingAdmin(input: unknown) {
  const parsed = bootstrapInputSchema.safeParse(input);
  if (!parsed.success)
    throw new AdminBootstrapError(
      "Bootstrap input is invalid; set a valid email and non-empty password.",
    );

  try {
    return await db.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users" WHERE "email" = ${parsed.data.email} FOR UPDATE
      `;
      if (lockedRows.length === 0)
        throw new AdminBootstrapError(
          "No registered account matches the bootstrap email. Register the account first.",
        );

      const account = await tx.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, role: true, passwordHash: true },
      });
      if (!account)
        throw new AdminBootstrapError(
          "The account changed during bootstrap. No role was changed.",
        );
      if (!(await bcrypt.compare(parsed.data.password, account.passwordHash)))
        throw new AdminBootstrapError(
          "Bootstrap credentials did not match. No role was changed.",
        );
      if (account.role === "ADMIN") return "already-admin" as const;

      const promoted = await tx.user.updateMany({
        where: { id: account.id, role: "USER" },
        data: { role: "ADMIN" },
      });
      if (promoted.count === 1) return "promoted" as const;

      const latest = await tx.user.findUnique({
        where: { id: account.id },
        select: { role: true },
      });
      if (latest?.role === "ADMIN") return "already-admin" as const;
      throw new AdminBootstrapError(
        "The account changed during bootstrap. No role was changed.",
      );
    });
  } catch (error) {
    if (error instanceof AdminBootstrapError) throw error;
    throw new AdminBootstrapError(
      "Bootstrap failed safely. Check database availability; credentials were not logged.",
    );
  }
}
