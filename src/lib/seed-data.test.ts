import { describe, expect, it } from "vitest";
import { categories, seedProducts } from "@/lib/seed-data";

describe("student-housing marketplace seed data", () => {
  it("uses only the approved dorm-relevant category taxonomy", () => {
    const slugs = categories.map(({ slug }) => slug);
    expect(slugs).toEqual([
      "furnitur-penyimpanan",
      "perlengkapan-tidur",
      "elektronik",
      "dapur",
      "kebersihan-laundry",
      "belajar-kerja",
      "lainnya",
    ]);
    expect(new Set(seedProducts.map(({ category }) => category.slug))).toEqual(
      new Set(slugs),
    );
  });
});
