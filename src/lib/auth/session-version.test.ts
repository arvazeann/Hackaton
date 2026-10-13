import { describe, expect, it } from "vitest";
import { isSessionVersionCurrent } from "./session-version";

describe("JWT session version revocation", () => {
  it("accepts a current enabled session and supports pre-rollout version zero", () => {
    expect(
      isSessionVersionCurrent(3, {
        disabledAt: null,
        sessionVersion: 3,
      }),
    ).toBe(true);
    expect(
      isSessionVersionCurrent(undefined, {
        disabledAt: null,
        sessionVersion: 0,
      }),
    ).toBe(true);
  });

  it("rejects a disabled account and revokes its old token after re-enabling", () => {
    const oldTokenVersion = 3;
    expect(
      isSessionVersionCurrent(oldTokenVersion, {
        disabledAt: new Date(),
        sessionVersion: 4,
      }),
    ).toBe(false);
    expect(
      isSessionVersionCurrent(oldTokenVersion, {
        disabledAt: null,
        sessionVersion: 4,
      }),
    ).toBe(false);
    expect(
      isSessionVersionCurrent(4, {
        disabledAt: null,
        sessionVersion: 4,
      }),
    ).toBe(true);
  });

  it("fails closed if the account no longer exists", () => {
    expect(isSessionVersionCurrent(0, null)).toBe(false);
  });
});
