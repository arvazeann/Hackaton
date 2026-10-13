import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson } from "@/server/admin/http";
import { readJson, validationResponse } from "@/server/http";
import { adminUserNameUpdateSchema } from "@/schemas";
import { updateAdminUserName } from "@/server/services/admin-mutations";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = adminUserNameUpdateSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse(
      "Nama pengguna tidak valid.",
      parsed.error.flatten().fieldErrors,
    );
  try {
    return privateJson(
      await updateAdminUserName((await context.params).id, parsed.data),
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
