import { describe, expect, it } from "vitest";
import {
  isNewlyUploaded,
  NEWLY_UPLOADED_WINDOW_MS,
} from "@/components/product/cards";

describe("newly uploaded product badge timing", () => {
  const now = Date.parse("2026-10-13T12:00:00.000Z");

  it("includes uploads through the seven-day boundary", () => {
    expect(
      isNewlyUploaded(
        new Date(now - NEWLY_UPLOADED_WINDOW_MS).toISOString(),
        now,
      ),
    ).toBe(true);
  });

  it("excludes uploads older than seven days and future timestamps", () => {
    expect(
      isNewlyUploaded(
        new Date(now - NEWLY_UPLOADED_WINDOW_MS - 1).toISOString(),
        now,
      ),
    ).toBe(false);
    expect(isNewlyUploaded(new Date(now + 1).toISOString(), now)).toBe(false);
  });

  it("ignores malformed timestamps", () => {
    expect(isNewlyUploaded("not-a-date", now)).toBe(false);
  });
});
