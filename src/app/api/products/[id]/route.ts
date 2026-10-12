import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { productSchema } from "@/schemas";
import { archiveProduct, updateProduct } from "@/server/services/products";
import {
  actionResponse,
  readJson,
  unauthenticatedResponse,
  validationResponse,
} from "@/server/http";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();
  const { id } = await params;

  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = productSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Periksa kembali isian form.",
      parsed.error.flatten().fieldErrors,
    );

  const result = await updateProduct(id, parsed.data, user.id);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/dashboard/products");
  }
  return actionResponse(result);
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();
  const { id } = await params;
  const result = await archiveProduct(id, user.id);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/dashboard/products");
  }
  return actionResponse(result);
}
