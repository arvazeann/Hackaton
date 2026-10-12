import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  setFavorite: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/favorites", () => ({
  setFavorite: mocks.setFavorite,
}));

import { DELETE } from "@/app/api/favorites/[id]/route";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const productId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: userId });
  mocks.setFavorite.mockResolvedValue({
    success: true,
    data: { id: productId, isFavorited: false },
  });
});

it("removes a favorite by route ID for the authenticated account", async () => {
  const response = await DELETE(
    new Request("http://localhost/api/favorites/id", { method: "DELETE" }),
    { params: Promise.resolve({ id: productId }) },
  );
  expect(response.status).toBe(200);
  expect(mocks.setFavorite).toHaveBeenCalledWith({ productId }, userId, false);
});
