import { getCurrentUser } from "@/lib/session";
import { ImageStorageError } from "@/server/storage/local-image-storage";
import {
  deleteSupabaseImage,
  saveImageToSupabase,
} from "@/server/storage/supabase-image-storage";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json(
      { message: "Silakan masuk untuk mengunggah foto." },
      { status: 401 },
    );

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { message: "Form unggahan tidak valid." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const purpose = formData.get("purpose");
  if (purpose !== "AVATAR" && purpose !== "LOGO" && purpose !== "PRODUCT")
    return Response.json(
      { message: "Tujuan unggahan tidak valid." },
      { status: 400 },
    );
  if (!(file instanceof File))
    return Response.json({ message: "Pilih satu file foto." }, { status: 400 });

  if (purpose === "PRODUCT") {
    const sellerProfile = await db.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { userId: true },
    });
    if (!sellerProfile)
      return Response.json(
        { message: "Lengkapi profil toko sebelum mengunggah foto produk." },
        { status: 403 },
      );
  }

  let storageKey: string | undefined;
  try {
    storageKey = await saveImageToSupabase(file);
    try {
      await db.uploadedFile.create({
        data: { key: storageKey, ownerId: user.id, purpose },
      });
    } catch {
      try {
        await deleteSupabaseImage(storageKey);
      } catch {
        // The file remains unreferenced and can be reconciled later.
      }
      return Response.json(
        { message: "Metadata foto gagal disimpan." },
        { status: 500 },
      );
    }
    return Response.json({ storageKey }, { status: 201 });
  } catch (error) {
    if (storageKey) {
      try {
        await deleteSupabaseImage(storageKey);
      } catch {
        // Do not expose provider details or credentials to the client.
      }
    }
    if (error instanceof ImageStorageError) {
      if (error.code === "TOO_LARGE")
        return Response.json(
          { message: "Ukuran foto maksimal 5 MB." },
          { status: 413 },
        );
      return Response.json(
        { message: "Gunakan foto JPEG, PNG, atau WebP yang valid." },
        { status: 400 },
      );
    }
    return Response.json(
      { message: "Foto gagal disimpan. Coba lagi." },
      { status: 500 },
    );
  }
}
