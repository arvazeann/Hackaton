import { getCurrentUser } from "@/lib/session";
import { getProfileHub } from "@/server/services/profile-hub";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Silakan masuk." }, { status: 401 });
  try {
    const data = await getProfileHub(user.id);
    if (!data)
      return Response.json(
        { message: "Akun tidak ditemukan." },
        { status: 404 },
      );
    return Response.json({ data });
  } catch {
    return Response.json(
      { message: "Ringkasan profil gagal dimuat." },
      { status: 500 },
    );
  }
}
