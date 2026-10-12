import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  updateProduct: vi.fn(),
  archiveProduct: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/products", () => ({
  updateProduct: mocks.updateProduct,
  archiveProduct: mocks.archiveProduct,
}));

import { DELETE, PATCH } from "@/app/api/products/[id]/route";

const sellerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const productId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const input = {
  title: "Kamera analog",
  description: "Kondisi baik",
  price: 100000,
  categoryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  condition: "good",
  city: "Bandung",
  images: [
    {
      storageKey: "dddddddd-dddd-4ddd-8ddd-dddddddddddd.jpg",
      position: 0,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: sellerId });
  mocks.updateProduct.mockResolvedValue({
    success: true,
    data: { id: productId },
  });
  mocks.archiveProduct.mockResolvedValue({
    success: true,
    data: { id: productId },
  });
});

describe("/api/products/[id]", () => {
  it("patches a product by route UUID using the authenticated seller", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/products/id", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
      { params: Promise.resolve({ id: productId }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.updateProduct).toHaveBeenCalledWith(
      productId,
      input,
      sellerId,
    );
  });

  it("archives through DELETE and rejects unauthenticated calls", async () => {
    expect(
      (
        await DELETE(new Request("http://localhost/api/products/id"), {
          params: Promise.resolve({ id: productId }),
        })
      ).status,
    ).toBe(200);
    expect(mocks.archiveProduct).toHaveBeenCalledWith(productId, sellerId);

    mocks.getCurrentUser.mockResolvedValue(null);
    expect(
      (
        await DELETE(new Request("http://localhost/api/products/id"), {
          params: Promise.resolve({ id: productId }),
        })
      ).status,
    ).toBe(401);
    expect(mocks.archiveProduct).toHaveBeenCalledTimes(1);
  });
});
