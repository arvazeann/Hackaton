import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { orderStatusSchema, cancelReasonSchema } from "@/schemas";
import { updateOrderStatus } from "@/server/services/orders";
import {
  actionResponse,
  readJson,
  unauthenticatedResponse,
  validationResponse,
} from "@/server/http";

const orderActionSchema = z
  .object({
    action: z.enum(["confirm", "reject", "cancel", "complete"]),
    reason: z.string().trim().optional(),
    paymentAccountId: z.uuid().optional(),
  })
  .strict();

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthenticatedResponse();
  const { id } = await params;

  const body = await readJson(request);
  if (!body.success) return body.response;
  const action = orderActionSchema.safeParse(body.data);
  if (!action.success)
    return validationResponse(
      "Periksa kembali aksi pesanan.",
      action.error.flatten().fieldErrors,
    );
  if (action.data.action === "cancel") {
    const reason = cancelReasonSchema.safeParse({ reason: action.data.reason });
    if (!reason.success)
      return validationResponse(
        "Periksa kembali aksi pesanan.",
        reason.error.flatten().fieldErrors,
      );
  }
  const parsed = orderStatusSchema.safeParse({ orderId: id, ...action.data });
  if (!parsed.success)
    return validationResponse(
      "Periksa kembali aksi pesanan.",
      parsed.error.flatten().fieldErrors,
    );

  const result = await updateOrderStatus(parsed.data, user.id);
  if (result.success) {
    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${result.data.productId}`);
  }
  return actionResponse(result);
}
