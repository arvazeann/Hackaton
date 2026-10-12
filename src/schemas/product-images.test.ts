import { describe, expect, it } from "vitest";
import { productSchema } from "@/schemas";

const validInput = {
  title: "Kamera analog",
  description: "Kondisi baik",
  price: 100000,
  categoryId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  condition: "good",
  city: "Bandung",
  images: [
    {
      storageKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp",
      position: 0,
    },
  ],
};

describe("product image schema", () => {
  it("accepts a generated image key and known legacy public asset", () => {
    expect(productSchema.safeParse(validInput).success).toBe(true);
    expect(
      productSchema.safeParse({
        ...validInput,
        images: [{ storageKey: "/products/item-2.svg", position: 0 }],
      }).success,
    ).toBe(true);
  });

  it("rejects malformed filenames and unknown keys without weakening strictness", () => {
    for (const storageKey of [
      "../secret.png",
      "photo.png",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.svg",
    ])
      expect(
        productSchema.safeParse({
          ...validInput,
          images: [{ storageKey, position: 0 }],
        }).success,
      ).toBe(false);

    expect(
      productSchema.safeParse({ ...validInput, extra: true }).success,
    ).toBe(false);
  });

  it("rejects more than five product images", () => {
    const images = Array.from({ length: 6 }, (_, position) => ({
      storageKey: `/products/item-${(position % 5) + 1}.svg`,
      position,
    }));
    expect(productSchema.safeParse({ ...validInput, images }).success).toBe(
      false,
    );
  });
});
