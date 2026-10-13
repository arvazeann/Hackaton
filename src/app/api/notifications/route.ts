import { getCurrentUser } from "@/lib/session";
import { getNotifications } from "@/server/services/notifications";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  try {
    return Response.json(
      await getNotifications(user.id, {
        page: params.get("page") ?? undefined,
        pageSize: params.get("pageSize") ?? undefined,
      }),
    );
  } catch {
    return Response.json(
      { message: "Permintaan tidak valid." },
      { status: 400 },
    );
  }
}
