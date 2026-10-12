import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  IMAGE_MAX_BYTES,
  LEGACY_IMAGE_KEY_PATTERN,
  STORED_IMAGE_FILENAME_PATTERN,
} from "@/lib/product-images";

const uploadEnvironmentSchema = z.object({
  UPLOAD_DIR: z.string().trim().min(1).optional(),
});

const imageTypes = {
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
  png: { mimeType: "image/png", extension: "png" },
  webp: { mimeType: "image/webp", extension: "webp" },
} as const;

export type StoredImageType = keyof typeof imageTypes;

export class ImageStorageError extends Error {
  constructor(
    readonly code: "INVALID_TYPE" | "TOO_LARGE" | "INVALID_FILENAME",
  ) {
    super(code);
    this.name = "ImageStorageError";
  }
}

export function getUploadDirectory() {
  const environment = uploadEnvironmentSchema.parse({
    UPLOAD_DIR: process.env.UPLOAD_DIR,
  });
  const uploadDirectory = path.resolve(
    /* turbopackIgnore: true */
    process.cwd(),
    environment.UPLOAD_DIR ?? "./storage/uploads",
  );
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relativeToPublic = path.relative(publicDirectory, uploadDirectory);
  if (
    relativeToPublic === "" ||
    (relativeToPublic !== ".." &&
      !relativeToPublic.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeToPublic))
  )
    throw new Error("UPLOAD_DIR must be outside public/.");
  return uploadDirectory;
}

export function detectImageType(bytes: Uint8Array): StoredImageType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "jpeg";

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "png";

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "webp";

  return null;
}

export function resolveStoredImagePath(filename: string) {
  if (!STORED_IMAGE_FILENAME_PATTERN.test(filename))
    throw new ImageStorageError("INVALID_FILENAME");

  const root = getUploadDirectory();
  const resolved = path.resolve(/* turbopackIgnore: true */ root, filename);
  if (path.dirname(resolved) !== root)
    throw new ImageStorageError("INVALID_FILENAME");
  return resolved;
}

export async function saveImageFile(file: File): Promise<string> {
  if (file.size > IMAGE_MAX_BYTES) throw new ImageStorageError("TOO_LARGE");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > IMAGE_MAX_BYTES)
    throw new ImageStorageError("TOO_LARGE");

  const detectedType = detectImageType(bytes);
  if (!detectedType) throw new ImageStorageError("INVALID_TYPE");

  const filename = `${randomUUID()}.${imageTypes[detectedType].extension}`;
  const filePath = resolveStoredImagePath(filename);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes, { flag: "wx" });
  return filename;
}

export async function storedImageExists(storageKey: string): Promise<boolean> {
  if (LEGACY_IMAGE_KEY_PATTERN.test(storageKey)) {
    const legacyPath = path.resolve(process.cwd(), "public", `.${storageKey}`);
    try {
      await access(legacyPath);
      return true;
    } catch {
      return false;
    }
  }

  if (!STORED_IMAGE_FILENAME_PATTERN.test(storageKey)) return false;
  try {
    const imageStat = await stat(resolveStoredImagePath(storageKey));
    return imageStat.isFile();
  } catch {
    return false;
  }
}

export async function deleteStoredImage(storageKey: string): Promise<void> {
  if (!STORED_IMAGE_FILENAME_PATTERN.test(storageKey)) return;
  try {
    await unlink(resolveStoredImagePath(storageKey));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    )
      return;
    throw error;
  }
}

export function createStoredImageReadStream(filename: string) {
  return createReadStream(resolveStoredImagePath(filename));
}

export async function getStoredImageStat(filename: string) {
  return stat(resolveStoredImagePath(filename));
}

export function storedImageMimeType(filename: string) {
  if (!STORED_IMAGE_FILENAME_PATTERN.test(filename)) return null;
  const extension = path.extname(filename).slice(1).toLowerCase();
  return extension === "jpg"
    ? imageTypes.jpeg.mimeType
    : extension === "png"
      ? imageTypes.png.mimeType
      : imageTypes.webp.mimeType;
}

export interface ImageStorageAdapter {
  save(file: File): Promise<string>;
  exists(storageKey: string): Promise<boolean>;
  delete(storageKey: string): Promise<void>;
  openReadStream(
    filename: string,
  ): ReturnType<typeof createStoredImageReadStream>;
  stat(filename: string): ReturnType<typeof getStoredImageStat>;
  mimeType(filename: string): string | null;
}

export const localImageStorage: ImageStorageAdapter = {
  save: saveImageFile,
  exists: storedImageExists,
  delete: deleteStoredImage,
  openReadStream: createStoredImageReadStream,
  stat: getStoredImageStat,
  mimeType: storedImageMimeType,
};
