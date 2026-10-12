import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/profile", () => ({
  getProfile: mocks.getProfile,
  updateProfile: mocks.updateProfile,
}));

import { GET, PATCH } from "@/app/api/profile/route";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const input = {
  name: "Raka Pratama",
  phone: "081234567890",
  city: "Bandung",
  bio: "",
  avatarKey: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: userId });
  mocks.getProfile.mockResolvedValue({
    id: userId,
    ...input,
    email: "raka@example.id",
  });
  mocks.updateProfile.mockResolvedValue({
    success: true,
    data: { id: userId, ...input },
  });
});

describe("/api/profile", () => {
  it("reads only the authenticated profile", async () => {
    expect((await GET()).status).toBe(200);
    expect(mocks.getProfile).toHaveBeenCalledWith(userId);
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("updates only allowed fields for the session user", async () => {
    const invalid = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...input, id: "forged" }),
      }),
    );
    expect(invalid.status).toBe(400);

    const valid = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    expect(valid.status).toBe(200);
    expect(mocks.updateProfile).toHaveBeenCalledWith(input, userId);
  });
});
