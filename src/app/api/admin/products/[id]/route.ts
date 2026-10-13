import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson } from "@/server/admin/http";
import { readJson, validationResponse } from "@/server/http";
import { adminProductUpdateSchema } from "@/schemas";
import { updateAdminProduct } from "@/server/services/admin-mutations";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = adminProductUpdateSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Data produk tidak valid.",
      parsed.error.flatten().fieldErrors,
    );
  try {
    return privateJson(
      await updateAdminProduct((await context.params).id, parsed.data),
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
