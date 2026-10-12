import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { productSchema } from "@/schemas";
import { createProduct } from "@/server/services/products";
import {
  actionResponse,
  readJson,
  unauthenticatedResponse,
  validationResponse,
} from "@/server/http";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();

  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = productSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Periksa kembali isian form.",
      parsed.error.flatten().fieldErrors,
    );

  const result = await createProduct(parsed.data, user.id);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/dashboard/products");
  }
  return actionResponse(result, 201);
}
