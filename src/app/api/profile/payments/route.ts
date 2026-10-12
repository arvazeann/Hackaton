import { getCurrentUser } from "@/lib/session";
import { savePaymentAccount } from "@/server/services/profile-hub";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Data tidak valid." }, { status: 400 });
  }
  const result = await savePaymentAccount(user.id, body);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
