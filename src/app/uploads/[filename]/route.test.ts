import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const storageMocks = vi.hoisted(() => ({
  exists: vi.fn(),
  publicUrl: vi.fn(),
}));
vi.mock("@/server/storage/supabase-image-storage", () => ({
  supabaseImageExists: storageMocks.exists,
  publicSupabaseImageUrl: storageMocks.publicUrl,
}));
import { GET } from "./route";

const filename = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg";
let directory = "";

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "preloved-image-route-"));
  vi.stubEnv("UPLOAD_DIR", directory);
  storageMocks.exists.mockResolvedValue(false);
  storageMocks.publicUrl.mockReturnValue(null);
  await mkdir(directory, { recursive: true });
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("GET /uploads/[filename]", () => {
  it("streams stored images with safe MIME and immutable cache headers", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    await writeFile(path.join(directory, filename), bytes);

    const response = await GET(new Request("http://localhost/uploads/image"), {
      params: Promise.resolve({ filename }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("redirects stored objects to the public Supabase URL", async () => {
    storageMocks.exists.mockResolvedValue(true);
    storageMocks.publicUrl.mockReturnValue(
      "https://project.supabase.co/storage/v1/object/public/ruanglagi-images/" +
        filename,
    );
    const response = await GET(new Request("http://localhost/uploads/image"), {
      params: Promise.resolve({ filename }),
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("supabase.co/storage/");
  });

  it.each(["../package.json", "..%2f..%2fpackage.json", "missing.webp"])(
    "returns 404 for unsafe or missing filename %s",
    async (unsafeFilename) => {
      const response = await GET(new Request("http://localhost/uploads/file"), {
        params: Promise.resolve({ filename: unsafeFilename }),
      });
      expect(response.status).toBe(404);
    },
  );
});
