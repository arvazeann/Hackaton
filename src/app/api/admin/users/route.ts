import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson, searchQuery } from "@/server/admin/http";
import { listAdminUsers } from "@/server/services/admin";

export async function GET(request: Request) {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  try {
    return privateJson(await listAdminUsers(searchQuery(request)));
  } catch (error) {
    return adminErrorResponse(error);
  }
}
