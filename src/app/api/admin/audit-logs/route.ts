import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson, searchQuery } from "@/server/admin/http";
import { listAdminAuditLogs } from "@/server/services/admin";

export async function GET(request: Request) {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  try {
    return privateJson(await listAdminAuditLogs(searchQuery(request)));
  } catch (error) {
    return adminErrorResponse(error);
  }
}
