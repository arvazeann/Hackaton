import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  saveImageFile: vi.fn(),
  createUploadedFile: vi.fn(),
  StorageError: class StorageError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  },
}));

vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({
  db: { uploadedFile: { create: mocks.createUploadedFile } },
}));
vi.mock("@/server/storage/local-image-storage", () => ({
  ImageStorageError: mocks.StorageError,
  localImageStorage: { save: mocks.saveImageFile },
}));

import { POST } from "./route";

function uploadRequest(file: File, purpose = "PRODUCT") {
  const data = new FormData();
  data.set("file", file);
  data.set("purpose", purpose);
  return new Request("http://localhost/api/uploads", {
    method: "POST",
    body: data,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: "seller-uuid" });
  mocks.saveImageFile.mockResolvedValue(
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
  );
  mocks.createUploadedFile.mockResolvedValue({});
});

describe("POST /api/uploads", () => {
  it("rejects anonymous uploads before reading the multipart body", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await POST(uploadRequest(new File(["image"], "x.jpg")));
    expect(response.status).toBe(401);
    expect(mocks.saveImageFile).not.toHaveBeenCalled();
  });

  it("returns the generated stored filename for an authenticated upload", async () => {
    const file = new File(["jpeg bytes"], "original-name.jpg", {
      type: "image/jpeg",
    });
    const response = await POST(uploadRequest(file));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      storageKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
    });
    const savedFile = mocks.saveImageFile.mock.calls[0]?.[0] as File;
    expect(savedFile).toMatchObject({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    expect(mocks.createUploadedFile).toHaveBeenCalledWith({
      data: {
        key: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
        ownerId: "seller-uuid",
        purpose: "PRODUCT",
      },
    });
  });

  it("records avatar and logo purpose metadata for the session owner", async () => {
    await POST(uploadRequest(new File(["image"], "avatar.jpg"), "AVATAR"));
    expect(mocks.createUploadedFile).toHaveBeenCalledWith({
      data: {
        key: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
        ownerId: "seller-uuid",
        purpose: "AVATAR",
      },
    });
  });

  it("rejects an unrecognized purpose", async () => {
    const response = await POST(
      uploadRequest(new File(["image"], "x.jpg"), "OTHER"),
    );
    expect(response.status).toBe(400);
    expect(mocks.saveImageFile).not.toHaveBeenCalled();
  });

  it("returns a safe validation error from storage", async () => {
    mocks.saveImageFile.mockRejectedValue(
      new mocks.StorageError("INVALID_TYPE"),
    );
    const response = await POST(
      uploadRequest(new File(["not an image"], "photo.png")),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Gunakan foto JPEG, PNG, atau WebP yang valid.",
    });
  });

  it("returns the payload-too-large status for files over the limit", async () => {
    mocks.saveImageFile.mockRejectedValue(new mocks.StorageError("TOO_LARGE"));
    const response = await POST(
      uploadRequest(new File(["large file"], "photo.jpg")),
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      message: "Ukuran foto maksimal 5 MB.",
    });
  });
});
