import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { markNotificationRead } from "@/server/services/notifications";

const idSchema = z.uuid();

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success)
    return Response.json(
      { message: "Notifikasi tidak ditemukan." },
      { status: 404 },
    );
  const updated = await markNotificationRead(user.id, id);
  return updated
    ? Response.json({ ok: true })
    : Response.json(
        { message: "Notifikasi tidak ditemukan." },
        { status: 404 },
      );
}
