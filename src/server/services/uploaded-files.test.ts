import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ uploadedFile: { findFirst: vi.fn() } }));
vi.mock("@/lib/db", () => ({ db: mock }));
import { ownsUploadedFile } from "@/server/services/uploaded-files";

describe("uploaded file ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects another user's avatar key", async () => {
    mock.uploadedFile.findFirst.mockResolvedValue(null);
    expect(await ownsUploadedFile("key.jpg", "user-a", "AVATAR")).toBe(false);
    expect(mock.uploadedFile.findFirst).toHaveBeenCalledWith({
      where: { key: "key.jpg", ownerId: "user-a", purpose: "AVATAR" },
      select: { key: true },
    });
  });

  it("rejects another user's logo key and rejects wrong-purpose avatar/logo keys", async () => {
    mock.uploadedFile.findFirst.mockResolvedValue(null);
    expect(await ownsUploadedFile("foreign-logo.jpg", "user-a", "LOGO")).toBe(
      false,
    );
    expect(await ownsUploadedFile("product.jpg", "user-a", "AVATAR")).toBe(
      false,
    );
    expect(await ownsUploadedFile("avatar.jpg", "user-a", "LOGO")).toBe(false);
  });

  it("rejects a key registered for a different purpose", async () => {
    mock.uploadedFile.findFirst.mockResolvedValue(null);
    expect(await ownsUploadedFile("key.jpg", "user-a", "LOGO")).toBe(false);
  });

  it("accepts only the matching owner and purpose", async () => {
    mock.uploadedFile.findFirst.mockResolvedValue({ key: "key.jpg" });
    expect(await ownsUploadedFile("key.jpg", "user-a", "AVATAR")).toBe(true);
  });
});
