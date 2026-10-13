import { getCurrentUser } from "@/lib/session";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/server/services/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  return Response.json({
    preferences: await getNotificationPreferences(user.id),
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Data tidak valid." }, { status: 400 });
  }
  const result = await saveNotificationPreferences(user.id, body);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
