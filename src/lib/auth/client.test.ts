import { beforeEach, describe, expect, it, vi } from "vitest";

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("next-auth/react", () => ({ signIn }));

import { signInWithCredentials } from "./client";

describe("signInWithCredentials", () => {
  beforeEach(() => signIn.mockReset());

  it("returns success and sends the credentials to Auth.js", async () => {
    signIn.mockResolvedValue({ ok: true });

    await expect(
      signInWithCredentials("person@example.test", "password-valid", "/"),
    ).resolves.toBe("success");
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "person@example.test",
      password: "password-valid",
      redirect: false,
      redirectTo: "/",
    });
  });

  it("identifies invalid credentials separately from service failures", async () => {
    signIn.mockResolvedValueOnce({ error: "CredentialsSignin" });
    await expect(
      signInWithCredentials("person@example.test", "wrong-pass", "/"),
    ).resolves.toBe("invalid");

    signIn.mockResolvedValueOnce({ error: "Configuration" });
    await expect(
      signInWithCredentials("person@example.test", "password-valid", "/"),
    ).resolves.toBe("unavailable");
  });
});
