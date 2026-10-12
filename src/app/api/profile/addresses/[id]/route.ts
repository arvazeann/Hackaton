import { getCurrentUser } from "@/lib/session";
import { deleteAddress } from "@/server/services/profile-hub";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  const { id } = await context.params;
  const deleted = await deleteAddress(user.id, id);
  return deleted
    ? new Response(null, { status: 204 })
    : Response.json({ message: "Alamat tidak ditemukan." }, { status: 404 });
}
