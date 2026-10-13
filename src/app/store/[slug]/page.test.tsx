import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPublicStore: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND_ROUTE");
  },
}));
vi.mock("@/components/layout/shell", () => ({ Shell: () => null }));
vi.mock("@/components/product/cards", () => ({ ProductGrid: () => null }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/services/products", () => ({
  getPublicStore: mocks.getPublicStore,
}));

import PublicStorePage from "@/app/store/[slug]/page";

describe("/store/[slug]", () => {
  it("returns 404 for an unknown store slug", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getPublicStore.mockResolvedValue(null);
    await expect(
      PublicStorePage({
        params: Promise.resolve({ slug: "does-not-exist" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NOT_FOUND_ROUTE");
  });
});
