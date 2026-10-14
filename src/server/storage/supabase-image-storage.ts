import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  IMAGE_MAX_BYTES,
  STORED_IMAGE_FILENAME_PATTERN,
} from "@/lib/product-images";
import {
  detectImageType,
  ImageStorageError,
  type StoredImageType,
} from "@/server/storage/local-image-storage";

const environmentSchema = z
  .object({
    SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().min(1).optional(),
    ),
    SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().min(1).optional(),
    ),
    SUPABASE_STORAGE_BUCKET: z
      .string()
      .trim()
      .min(1)
      .default("ruanglagi-images"),
  })
  .refine(
    (environment) =>
      environment.SUPABASE_SECRET_KEY || environment.SUPABASE_SERVICE_ROLE_KEY,
    { message: "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY" },
  );

const imageTypes: Record<
  StoredImageType,
  { mimeType: string; extension: string }
> = {
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
  png: { mimeType: "image/png", extension: "png" },
  webp: { mimeType: "image/webp", extension: "webp" },
};

function configuration() {
  const environment = environmentSchema.parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
  });
  const apiKey =
    environment.SUPABASE_SECRET_KEY ?? environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey) throw new Error("Set a Supabase server secret key");

  return {
    ...environment,
    apiKey,
    authorization:
      environment.SUPABASE_SECRET_KEY === undefined
        ? `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`
        : undefined,
  };
}

function objectUrl(
  baseUrl: string,
  bucket: string,
  key: string,
  publicRead = false,
) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/${publicRead ? "public/" : ""}${encodedBucket}/${encodedKey}`;
}

function headers() {
  const config = configuration();
  return {
    config,
    headers: {
      apikey: config.apiKey,
      ...(config.authorization ? { Authorization: config.authorization } : {}),
    },
  };
}

export async function saveImageToSupabase(file: File): Promise<string> {
  if (file.size > IMAGE_MAX_BYTES) throw new ImageStorageError("TOO_LARGE");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > IMAGE_MAX_BYTES)
    throw new ImageStorageError("TOO_LARGE");
  const type = detectImageType(bytes);
  if (!type) throw new ImageStorageError("INVALID_TYPE");

  const filename = `${randomUUID()}.${imageTypes[type].extension}`;
  await putImage(filename, bytes, imageTypes[type].mimeType);
  return filename;
}

async function putImage(filename: string, bytes: Buffer, mimeType: string) {
  const { config, headers: authHeaders } = headers();
  const response = await fetch(
    objectUrl(config.SUPABASE_URL, config.SUPABASE_STORAGE_BUCKET, filename),
    {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": mimeType,
        "Cache-Control": "31536000",
        "x-upsert": "false",
      },
      body: new Blob([new Uint8Array(bytes)]),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Supabase Storage upload failed");
}

export async function copyLocalImageToSupabase(
  filename: string,
  bytes: Buffer,
) {
  if (!STORED_IMAGE_FILENAME_PATTERN.test(filename))
    throw new ImageStorageError("INVALID_FILENAME");
  const type = detectImageType(bytes);
  if (
    !type ||
    !filename.toLowerCase().endsWith(`.${imageTypes[type].extension}`)
  )
    throw new ImageStorageError("INVALID_TYPE");
  if (bytes.byteLength > IMAGE_MAX_BYTES)
    throw new ImageStorageError("TOO_LARGE");
  await putImage(filename, bytes, imageTypes[type].mimeType);
}

export async function supabaseImageExists(
  storageKey: string,
): Promise<boolean> {
  if (!STORED_IMAGE_FILENAME_PATTERN.test(storageKey)) return false;
  const config = configuration();
  const response = await fetch(
    objectUrl(
      config.SUPABASE_URL,
      config.SUPABASE_STORAGE_BUCKET,
      storageKey,
      true,
    ),
    { method: "HEAD", cache: "no-store" },
  );
  if (response.status === 404) return false;
  if (!response.ok)
    throw new Error("Supabase Storage availability check failed");
  return true;
}

export async function deleteSupabaseImage(storageKey: string): Promise<void> {
  if (!STORED_IMAGE_FILENAME_PATTERN.test(storageKey)) return;
  const { config, headers: authHeaders } = headers();
  const response = await fetch(
    `${config.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(config.SUPABASE_STORAGE_BUCKET)}`,
    {
      method: "DELETE",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [storageKey] }),
      cache: "no-store",
    },
  );
  if (!response.ok && response.status !== 404)
    throw new Error("Supabase Storage delete failed");
}

export function publicSupabaseImageUrl(storageKey: string): string | null {
  if (!STORED_IMAGE_FILENAME_PATTERN.test(storageKey)) return null;
  const { config } = headers();
  return objectUrl(
    config.SUPABASE_URL,
    config.SUPABASE_STORAGE_BUCKET,
    storageKey,
    true,
  );
}
