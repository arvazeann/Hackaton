import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  updateOrderStatus: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/orders", () => ({
  updateOrderStatus: mocks.updateOrderStatus,
}));

import { PATCH } from "@/app/api/orders/[id]/route";

const buyerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orderId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: buyerId });
  mocks.updateOrderStatus.mockResolvedValue({
    success: true,
    data: { id: orderId, productId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
  });
});

describe("PATCH /api/orders/[id]", () => {
  it("injects the resource UUID from the route and session actor", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/orders/id", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: "Berubah pikiran" }),
      }),
      { params: Promise.resolve({ id: orderId }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.updateOrderStatus).toHaveBeenCalledWith(
      { orderId, action: "cancel", reason: "Berubah pikiran" },
      buyerId,
    );
  });

  it("rejects invalid actions and forged order IDs", async () => {
    for (const payload of [
      { action: "cancel", reason: "bad" },
      { action: "confirm", orderId: "forged" },
    ]) {
      const response = await PATCH(
        new Request("http://localhost/api/orders/id", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }),
        { params: Promise.resolve({ id: orderId }) },
      );
      expect(response.status).toBe(400);
    }
    expect(mocks.updateOrderStatus).not.toHaveBeenCalled();
  });
});
