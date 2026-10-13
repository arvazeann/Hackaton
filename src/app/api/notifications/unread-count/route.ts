import { getCurrentUser } from "@/lib/session";
import { getUnreadNotificationCount } from "@/server/services/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  return Response.json({ count: await getUnreadNotificationCount(user.id) });
}
