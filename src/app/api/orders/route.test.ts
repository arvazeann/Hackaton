import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createOrder: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/orders", () => ({ createOrder: mocks.createOrder }));

import { POST } from "@/app/api/orders/route";

const buyerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const productId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const input = {
  productId,
  shippingName: "Raka Pratama",
  shippingPhone: "081234567890",
  shippingAddress: "Jl. Merdeka 10, Bandung",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: buyerId });
  mocks.createOrder.mockResolvedValue({
    success: true,
    data: { id: "order", productId },
  });
});

describe("POST /api/orders", () => {
  it("validates order data and passes the session buyer to Prisma service", async () => {
    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...input, buyerId: "spoofed", priceAtOrder: 1 }),
      }),
    );
    expect(response.status).toBe(400);

    const valid = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    expect(valid.status).toBe(201);
    expect(mocks.createOrder).toHaveBeenCalledWith(input, buyerId);
  });

  it("rejects unauthenticated order placement", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(401);
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });
});
