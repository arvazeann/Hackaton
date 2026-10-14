import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  deleteSupabaseImage,
  publicSupabaseImageUrl,
  saveImageToSupabase,
  supabaseImageExists,
} from "@/server/storage/supabase-image-storage";

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

  it("rejects content that is not a supported image before contacting Storage", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      saveImageToSupabase(new File(["not an image"], "photo.jpg")),
    ).rejects.toMatchObject({ code: "INVALID_TYPE" });
    expect(fetchMock).not.toHaveBeenCalled();
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
