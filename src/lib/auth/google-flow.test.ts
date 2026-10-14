import { describe, expect, it } from "vitest";
import {
  getGoogleAuthErrorMessage,
  getSafeCallbackUrl,
} from "@/lib/auth/google-flow";

describe("Google authentication flow helpers", () => {
  it("keeps same-site callback paths and query parameters", () => {
    expect(getSafeCallbackUrl("/products?category=home#new")).toBe(
      "/products?category=home#new",
    );
  });

  it.each([
    null,
    "",
    "https://attacker.example/path",
    "//attacker.example/path",
    "/\\attacker.example/path",
  ])("falls back to home for unsafe callback %s", (value) => {
    expect(getSafeCallbackUrl(value)).toBe("/");
  });

  it("maps known provider errors to safe user messages", () => {
    expect(getGoogleAuthErrorMessage("AccessDenied")).toContain("dibatalkan");
    expect(getGoogleAuthErrorMessage("OAuthCallbackError")).toContain(
      "Login Google belum berhasil",
    );
  });

  it("does not expose arbitrary error query values", () => {
    expect(getGoogleAuthErrorMessage("secret-token-value")).toBe(
      "Login belum berhasil. Coba lagi.",
    );
    expect(getGoogleAuthErrorMessage(null)).toBeNull();
  });
});
