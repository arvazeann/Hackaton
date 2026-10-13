import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { getCurrentUser, recordCurrentUserActivity } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";

export class AdminAuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(
      status === 401
        ? "Authentication required"
        : "Administrator access required",
    );
    this.name = "AdminAuthorizationError";
  }
}

export class AdminRecordNotFoundError extends Error {
  constructor() {
    super("Data tidak ditemukan.");
    this.name = "AdminRecordNotFoundError";
  }
}

export async function requireAdminActor(): Promise<{ id: string }> {
  const session = await auth();
  const actorId = session?.user?.id;
  if (!actorId) throw new AdminAuthorizationError(401);

  const actor = await db.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true },
  });
  if (!actor || actor.role !== "ADMIN") throw new AdminAuthorizationError(403);
  return { id: actor.id };
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminRecordNotFoundError) {
    return Response.json({ message: error.message }, { status: 404 });
  }
  if (error instanceof z.ZodError) {
    return Response.json(
      { message: "Filter atau halaman tidak valid." },
      { status: 400 },
    );
  }
  if (error instanceof AdminAuthorizationError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  return Response.json({ message: "Permintaan admin gagal." }, { status: 500 });
}

export async function requireAdminRequest() {
  const user = await getCurrentUser({ recordActivity: false });
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  if (user.platformRole !== "ADMIN")
    return Response.json(
      { message: "Akses admin diperlukan." },
      { status: 403 },
    );
  await recordCurrentUserActivity(user.id);
  return { id: user.id };
}

export async function requireAdminPage(callbackUrl: string) {
  const user = await getCurrentUser({ recordActivity: false });
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (user.platformRole !== "ADMIN") redirect("/");
  await recordCurrentUserActivity(user.id);
  return user;
}
