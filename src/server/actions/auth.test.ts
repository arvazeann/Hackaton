import { describe, expect, it, vi } from "vitest";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock("../../../auth", () => ({ signOut }));

import { logout } from "./auth";

describe("logout action", () => {
  it("delegates session termination to Auth.js and returns to home", async () => {
    await logout();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
