import {
  adminErrorResponse,
  requireAdminRequest,
} from "@/server/admin/authorization";
import { privateJson } from "@/server/admin/http";
import { revealAdminUserEmail } from "@/server/services/admin";
import { z } from "zod";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminRequest();
  if (access instanceof Response) return access;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    return privateJson({ message: "Pengguna tidak ditemukan." }, 404);
  try {
    return privateJson(await revealAdminUserEmail(id));
  } catch (error) {
    return adminErrorResponse(error);
  }
}
