import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

vi.mock("server-only", () => ({}));

import {
  deleteSupabaseImage,
  publicSupabaseImageUrl,
  saveImageToSupabase,
  supabaseImageExists,
} from "@/server/storage/supabase-image-storage";
import { IMAGE_MAX_BYTES } from "@/lib/product-images";

const serviceKey = "server-only-test-key";

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://project-ref.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", serviceKey);
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  vi.stubEnv("SUPABASE_STORAGE_BUCKET", "ruanglagi-images");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Supabase image storage", () => {
  it("accepts a file at the 3 MB limit and rejects one byte over", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const bytes = new Uint8Array(IMAGE_MAX_BYTES);
    bytes.set([0xff, 0xd8, 0xff, 0xd9]);

    await expect(
      saveImageToSupabase(new File([bytes], "at-limit.jpg")),
    ).resolves.toMatch(/\.jpg$/);
    expect(fetchMock).toHaveBeenCalledOnce();

    fetchMock.mockClear();
    const oversized = new Uint8Array(IMAGE_MAX_BYTES + 1);
    oversized.set([0xff, 0xd8, 0xff, 0xd9]);
    await expect(
      saveImageToSupabase(new File([oversized], "over-limit.jpg")),
    ).rejects.toMatchObject({ code: "TOO_LARGE" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploads validated bytes to the configured bucket with server credentials", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const jpeg = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0xd9])],
      "client-name.jpg",
      { type: "application/octet-stream" },
    );

    const key = await saveImageToSupabase(jpeg);

    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/i,
    );
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://project-ref.supabase.co/storage/v1/object/ruanglagi-images/${key}`,
    );
    expect(request.method).toBe("POST");
    expect(new Headers(request.headers).get("Content-Type")).toBe("image/jpeg");
    expect(new Headers(request.headers).get("x-upsert")).toBe("false");
    expect(new Headers(request.headers).get("Authorization")).toBe(
      `Bearer ${serviceKey}`,
    );
  });

  it("completes a real HTTP upload against an isolated Storage stub with a secret API key", async () => {
    let resolveRequest!: (request: {
      method: string;
      url: string;
      headers: import("node:http").IncomingHttpHeaders;
      body: Buffer;
    }) => void;
    const received = new Promise<{
      method: string;
      url: string;
      headers: import("node:http").IncomingHttpHeaders;
      body: Buffer;
    }>((resolve) => {
      resolveRequest = resolve;
    });
    const server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        resolveRequest({
          method: request.method ?? "",
          url: request.url ?? "",
          headers: request.headers,
          body: Buffer.concat(chunks),
        });
        response.writeHead(200).end();
      });
    });

    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address() as AddressInfo;
    vi.stubEnv("SUPABASE_URL", `http://127.0.0.1:${address.port}`);
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_local-lab-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    try {
      const key = await saveImageToSupabase(
        new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "photo.jpg"),
      );
      const request = await received;

      expect(key).toMatch(/\.jpg$/);
      expect(request.method).toBe("POST");
      expect(request.url).toMatch(
        /^\/storage\/v1\/object\/ruanglagi-images\/[0-9a-f-]+\.jpg$/i,
      );
      expect(request.headers.apikey).toBe("sb_secret_local-lab-key");
      expect(request.headers.authorization).toBeUndefined();
      expect(request.headers["content-type"]).toBe("image/jpeg");
      expect(request.headers["x-upsert"]).toBe("false");
      expect(request.body).toEqual(Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it("rejects content that is not a supported image before contacting Storage", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      saveImageToSupabase(new File(["not an image"], "photo.jpg")),
    ).rejects.toMatchObject({ code: "INVALID_TYPE" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves safe provider status details when Storage rejects an upload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { statusCode: "403", error: "Unauthorized" },
          { status: 403 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      saveImageToSupabase(
        new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "photo.jpg"),
      ),
    ).rejects.toMatchObject({ status: 403, providerCode: "Unauthorized" });
  });

  it("uses the stable public object URL for later reads without sending a secret", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg";

    await expect(supabaseImageExists(key)).resolves.toBe(true);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.method).toBe("HEAD");
    expect(url).toBe(
      `https://project-ref.supabase.co/storage/v1/object/public/ruanglagi-images/${key}`,
    );
    expect(new Headers(request.headers).get("Authorization")).toBeNull();
    expect(publicSupabaseImageUrl(key)).toBe(url);
  });

  it("deletes by storage path using the server-only credential", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg";

    await deleteSupabaseImage(key);

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://project-ref.supabase.co/storage/v1/object/ruanglagi-images",
    );
    expect(request.method).toBe("DELETE");
    expect(JSON.parse(String(request.body))).toEqual({ prefixes: [key] });
    expect(new Headers(request.headers).get("Authorization")).toBe(
      `Bearer ${serviceKey}`,
    );
  });
});
