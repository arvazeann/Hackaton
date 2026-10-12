import { db } from "@/lib/db";
import type { UploadedFilePurpose } from "@/generated/prisma/client";

export async function ownsUploadedFile(
  key: string,
  ownerId: string,
  purpose: UploadedFilePurpose,
) {
  return Boolean(
    await db.uploadedFile.findFirst({
      where: { key, ownerId, purpose },
      select: { key: true },
    }),
  );
}
