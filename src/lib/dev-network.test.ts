import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeDevAuthRequest } from "./dev-network";

afterEach(() => vi.unstubAllEnvs());

describe("normalizeDevAuthRequest", () => {
  it("rewrites Next dev's internal URL to a trusted LAN host", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const request = new Request(
      "http://localhost:3000/api/auth/callback/credentials?source=lan",
      {
        method: "POST",
        headers: {
          host: "10.106.7.63:3000",
          origin: "http://10.106.7.63:3000",
          "x-forwarded-host": "10.106.7.63:3000",
          "x-forwarded-proto": "http",
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "email=test%40example.test",
      },
    );

    const normalized = normalizeDevAuthRequest(request, ["10.106.7.63"]);

    expect(new URL(normalized.url).origin).toBe("http://10.106.7.63:3000");
    expect(new URL(normalized.url).search).toBe("?source=lan");
    expect(normalized.headers.get("host")).toBe("10.106.7.63:3000");
    await expect(normalized.text()).resolves.toBe("email=test%40example.test");
  });

  it("leaves requests for untrusted hosts unchanged", () => {
    vi.stubEnv("NODE_ENV", "development");
    const request = new Request("http://localhost:3000/api/auth/callback", {
      headers: { host: "203.0.113.8:3000" },
    });

    expect(normalizeDevAuthRequest(request, ["10.106.7.63"])).toBe(request);
  });

  it("leaves requests with mismatched origins unchanged", () => {
    vi.stubEnv("NODE_ENV", "development");
    const request = new Request("http://localhost:3000/api/auth/callback", {
      headers: {
        host: "10.106.7.63:3000",
        origin: "http://attacker.example",
      },
    });

    expect(normalizeDevAuthRequest(request, ["10.106.7.63"])).toBe(request);
  });

  it("does not rewrite production requests", () => {
    vi.stubEnv("NODE_ENV", "production");
    const request = new Request("http://localhost:3000/api/auth/callback", {
      headers: { host: "10.106.7.63:3000" },
    });

    expect(normalizeDevAuthRequest(request, ["10.106.7.63"])).toBe(request);
  });
});
