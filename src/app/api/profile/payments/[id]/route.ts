import { getCurrentUser } from "@/lib/session";
import { deactivatePaymentAccount } from "@/server/services/profile-hub";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  const { id } = await context.params;
  const deleted = await deactivatePaymentAccount(user.id, id);
  return deleted
    ? new Response(null, { status: 204 })
    : Response.json(
        { message: "Akun pembayaran tidak ditemukan." },
        { status: 404 },
      );
}
