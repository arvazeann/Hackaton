import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { createOrderSchema } from "@/schemas";
import { createOrder } from "@/server/services/orders";
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
  const parsed = createOrderSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Periksa kembali data pesanan.",
      parsed.error.flatten().fieldErrors,
    );

  const result = await createOrder(parsed.data, user.id);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${result.data.productId}`);
    revalidatePath("/orders");
  }
  return actionResponse(result, 201);
}
