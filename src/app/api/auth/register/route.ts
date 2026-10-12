import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logAuthFailure } from "@/lib/auth/logging";
import { registerFormSchema } from "@/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "Periksa kembali isian form." },
      { status: 400 },
    );
  }

  const parsed = registerFormSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message: "Periksa kembali isian form.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const email = parsed.data.email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return Response.json(
        {
          message: "Email tidak dapat digunakan.",
          fieldErrors: { email: ["Email tidak dapat digunakan."] },
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await db.user.create({
      data: { name: parsed.data.name, email, passwordHash },
      select: { id: true },
    });
    return Response.json({ userId: user.id }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          message: "Email tidak dapat digunakan.",
          fieldErrors: { email: ["Email tidak dapat digunakan."] },
        },
        { status: 409 },
      );
    }
    logAuthFailure("Registration", error);
    return Response.json(
      { message: "Akun belum dapat dibuat. Coba lagi." },
      { status: 500 },
    );
  }
}
