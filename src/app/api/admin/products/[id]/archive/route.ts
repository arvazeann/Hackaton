import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson } from "@/server/admin/http";
import { adminProductArchiveSchema } from "@/schemas";
import { readJson, validationResponse } from "@/server/http";
import { archiveAdminProduct } from "@/server/services/admin-mutations";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  const body = await readJson(request);
  if (!body.success) return body.response;
  const parsed = adminProductArchiveSchema.safeParse(body.data);
  if (!parsed.success)
    return validationResponse("Permintaan arsip tidak valid.");
  try {
    return privateJson(await archiveAdminProduct((await context.params).id));
  } catch (error) {
    return adminErrorResponse(error);
  }
}
