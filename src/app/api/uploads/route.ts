import { getCurrentUser } from "@/lib/session";
import {
  ImageStorageError,
  localImageStorage,
} from "@/server/storage/local-image-storage";
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

  try {
    const storageKey = await localImageStorage.save(file);
    try {
      await db.uploadedFile.create({
        data: { key: storageKey, ownerId: user.id, purpose },
      });
    } catch {
      return Response.json(
        { message: "Metadata foto gagal disimpan." },
        { status: 500 },
      );
    }
    return Response.json({ storageKey }, { status: 201 });
  } catch (error) {
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
