import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CollectionEmptyState } from "@/components/profile/collection-empty-state";

describe("CollectionEmptyState", () => {
  it("shows an explanatory message and an actionable link", () => {
    const html = renderToStaticMarkup(
      createElement(CollectionEmptyState, {
        message: "Belum ada alamat.",
        href: "#address-form",
        actionLabel: "Tambah alamat",
      }),
    );

    expect(html).toContain("Belum ada alamat.");
    expect(html).toContain('href="#address-form"');
    expect(html).toContain("Tambah alamat");
  });
});
