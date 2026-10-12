import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createProduct: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/products", () => ({
  createProduct: mocks.createProduct,
}));

import { POST } from "@/app/api/products/route";

const sellerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const input = {
  title: "Kamera analog",
  description: "Kondisi baik",
  price: 100000,
  categoryId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  condition: "good",
  city: "Bandung",
  images: [
    {
      storageKey: "dddddddd-dddd-4ddd-8ddd-dddddddddddd.jpg",
      position: 0,
    },
  ],
};

function request(body: unknown) {
  return new Request("http://localhost/api/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: sellerId });
  mocks.createProduct.mockResolvedValue({
    success: true,
    data: { id: "product" },
  });
});

describe("POST /api/products", () => {
  it("validates product input and uses only the session account", async () => {
    const response = await POST(request(input));
    expect(response.status).toBe(201);
    expect(mocks.createProduct).toHaveBeenCalledWith(input, sellerId);

    const rejected = await POST(request({ ...input, sellerId: "spoofed" }));
    expect(rejected.status).toBe(400);
    expect(mocks.createProduct).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed JSON and unauthenticated visitors", async () => {
    const badJson = await POST(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: "{",
      }),
    );
    expect(badJson.status).toBe(400);
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await POST(request(input))).status).toBe(401);
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });
});
