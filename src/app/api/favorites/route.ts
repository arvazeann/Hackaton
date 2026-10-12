import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { favoriteSchema } from "@/schemas";
import { getFavorites, setFavorite } from "@/server/services/favorites";
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
  try {
    return Response.json({
      success: true,
      data: await getFavorites(user.id),
    });
  } catch {
    return internalErrorResponse("Favorit gagal dimuat.");
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();
  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = favoriteSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Produk tidak valid.",
      parsed.error.flatten().fieldErrors,
    );

  const result = await setFavorite(parsed.data, user.id, true);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${parsed.data.productId}`);
    revalidatePath("/favorites");
  }
  return actionResponse(result);
}
