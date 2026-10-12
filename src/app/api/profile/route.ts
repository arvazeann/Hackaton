import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { profileSchema } from "@/schemas";
import { getProfile, updateProfile } from "@/server/services/profile";
import {
  actionResponse,
  internalErrorResponse,
  readJson,
  unauthenticatedResponse,
  validationResponse,
} from "@/server/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();
  let profile: Awaited<ReturnType<typeof getProfile>>;
  try {
    profile = await getProfile(user.id);
  } catch {
    return internalErrorResponse("Profil gagal dimuat.");
  }
  if (!profile)
    return actionResponse({
      success: false,
      error: { code: "NOT_FOUND", message: "Akun tidak ditemukan." },
    });
  return Response.json({ success: true, data: profile });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();
  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = profileSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Periksa kembali data profil.",
      parsed.error.flatten().fieldErrors,
    );

  const result = await updateProfile(parsed.data, user.id);
  if (result.success) revalidatePath("/profile");
  return actionResponse(result);
}
