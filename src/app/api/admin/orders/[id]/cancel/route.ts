import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson } from "@/server/admin/http";
import { adminOrderCancelSchema } from "@/schemas";
import { readJson, validationResponse } from "@/server/http";
import { cancelAdminPendingOrder } from "@/server/services/admin-mutations";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = adminOrderCancelSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Alasan pembatalan wajib 5–500 karakter.",
      parsed.error.flatten().fieldErrors,
    );
  try {
    return privateJson(
      await cancelAdminPendingOrder((await context.params).id, parsed.data),
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
