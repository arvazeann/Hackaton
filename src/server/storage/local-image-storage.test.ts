import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  detectImageType,
  getUploadDirectory,
  ImageStorageError,
  resolveStoredImagePath,
  saveImageFile,
  storedImageExists,
} from "./local-image-storage";
import { IMAGE_MAX_BYTES } from "@/lib/product-images";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

let directory = "";

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "preloved-image-test-"));
  vi.stubEnv("UPLOAD_DIR", directory);
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("local image storage", () => {
  it("detects JPEG, PNG, and WebP from magic bytes only", () => {
    expect(detectImageType(jpeg)).toBe("jpeg");
    expect(detectImageType(png)).toBe("png");
    expect(detectImageType(webp)).toBe("webp");
    expect(detectImageType(new TextEncoder().encode("<svg></svg>"))).toBeNull();
    expect(
      detectImageType(new TextEncoder().encode("not an image")),
    ).toBeNull();
  });

  it("stores an image with a generated UUID filename and accepts exactly 5 MB", async () => {
    const bytes = new Uint8Array(IMAGE_MAX_BYTES);
    bytes.set(jpeg);
    const filename = await saveImageFile(
      new File([bytes], "seller-name.png", { type: "image/png" }),
    );

    expect(filename).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/i,
    );
    expect(await storedImageExists(filename)).toBe(true);
    expect((await readFile(path.join(directory, filename))).byteLength).toBe(
      IMAGE_MAX_BYTES,
    );
  });

  it("rejects an oversized file and SVG/text bytes even with an image filename", async () => {
    const tooLarge = new Uint8Array(IMAGE_MAX_BYTES + 1);
    tooLarge.set(jpeg);
    await expect(
      saveImageFile(new File([tooLarge], "photo.jpg", { type: "image/jpeg" })),
    ).rejects.toMatchObject({ code: "TOO_LARGE" });

    await expect(
      saveImageFile(
        new File([new TextEncoder().encode("<svg></svg>")], "photo.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toBeInstanceOf(ImageStorageError);
  });

  it("rejects path traversal and filenames outside the UUID extension pattern", () => {
    for (const filename of [
      "../package.json",
      "..%2f..%2fpackage.json",
      "%2e%2e%2fpackage.json",
      "package.json",
      "00000000-0000-4000-8000-000000000000.svg",
    ])
      expect(() => resolveStoredImagePath(filename)).toThrow(ImageStorageError);
  });

  it("rejects an upload directory configured inside public/", () => {
    vi.stubEnv("UPLOAD_DIR", path.join(process.cwd(), "public", "uploads"));
    expect(() => getUploadDirectory()).toThrow("outside public");
  });
});
