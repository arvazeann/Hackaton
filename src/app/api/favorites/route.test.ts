import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getFavorites: vi.fn(),
  setFavorite: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/favorites", () => ({
  getFavorites: mocks.getFavorites,
  setFavorite: mocks.setFavorite,
}));

import { GET, PUT } from "@/app/api/favorites/route";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const productId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: userId });
  mocks.getFavorites.mockResolvedValue([]);
  mocks.setFavorite.mockResolvedValue({
    success: true,
    data: { id: productId, isFavorited: true },
  });
});

describe("/api/favorites", () => {
  it("lists the session user's favorites and requires authentication", async () => {
    expect((await GET()).status).toBe(200);
    expect(mocks.getFavorites).toHaveBeenCalledWith(userId);
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(mocks.getFavorites).toHaveBeenCalledTimes(1);
  });

  it("validates favorite UUIDs and derives ownership from the session", async () => {
    const invalid = await PUT(
      new Request("http://localhost/api/favorites", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: "p1", userId: "forged" }),
      }),
    );
    expect(invalid.status).toBe(400);

    const valid = await PUT(
      new Request("http://localhost/api/favorites", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      }),
    );
    expect(valid.status).toBe(200);
    expect(mocks.setFavorite).toHaveBeenCalledWith({ productId }, userId, true);
  });
});
