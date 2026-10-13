import { getCurrentUser } from "@/lib/session";
import { markAllNotificationsRead } from "@/server/services/notifications";

export async function POST() {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  return Response.json({
    ok: true,
    updated: await markAllNotificationsRead(user.id),
  });
}
