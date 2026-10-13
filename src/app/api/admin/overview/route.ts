import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson } from "@/server/admin/http";
import { getAdminOverview } from "@/server/services/admin";

export async function GET() {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  try {
    return privateJson(await getAdminOverview());
  } catch (error) {
    return adminErrorResponse(error);
  }
}
