import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { setFavorite } from "@/server/services/favorites";
import { actionResponse, unauthenticatedResponse } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();
  const { id } = await params;
  const result = await setFavorite({ productId: id }, user.id, false);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/favorites");
  }
  return actionResponse(result);
}
