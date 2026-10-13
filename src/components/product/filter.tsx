"use client";

import { useSearchParams } from "next/navigation";

type CategoryOption = { id: string; name: string; slug: string };

function FilterFields({
  categories,
  search,
}: {
  categories: CategoryOption[];
  search: URLSearchParams;
}) {
  return (
    <>
      <label className="grid gap-1.5 text-xs font-medium text-stone-600">
        Kategori
        <select
          name="category"
          defaultValue={search.get("category") ?? ""}
          className="rounded-xl border bg-[#fffefa] p-2.5 text-sm text-stone-900"
        >
          <option value="">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-xs font-medium text-stone-600">
        Kondisi
        <select
          name="condition"
          defaultValue={search.get("condition") ?? ""}
          className="rounded-xl border bg-[#fffefa] p-2.5 text-sm text-stone-900"
        >
          <option value="">Semua kondisi</option>
          <option value="like_new">Seperti baru</option>
          <option value="good">Baik</option>
          <option value="fair">Cukup</option>
        </select>
      </label>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">Rentang harga</legend>
        <input
          name="minPrice"
          aria-label="Harga minimum"
          placeholder="Min harga"
          defaultValue={search.get("minPrice") ?? ""}
          className="min-w-0 rounded-xl border bg-[#fffefa] p-2.5 text-sm"
        />
        <input
          name="maxPrice"
          aria-label="Harga maksimum"
          placeholder="Maks harga"
          defaultValue={search.get("maxPrice") ?? ""}
          className="min-w-0 rounded-xl border bg-[#fffefa] p-2.5 text-sm"
        />
      </fieldset>
      <input
        name="city"
        aria-label="Kota"
        placeholder="Kota"
        defaultValue={search.get("city") ?? ""}
        className="rounded-xl border bg-[#fffefa] p-2.5 text-sm"
      />
      <label className="grid gap-1.5 text-xs font-medium text-stone-600">
        Urutkan
        <select
          name="sort"
          defaultValue={search.get("sort") ?? "newest"}
          className="rounded-xl border bg-[#fffefa] p-2.5 text-sm text-stone-900"
        >
          <option value="newest">Terbaru</option>
          <option value="price_asc">Harga terendah</option>
          <option value="price_desc">Harga tertinggi</option>
        </select>
      </label>
      <input type="hidden" name="q" value={search.get("q") ?? ""} />
    </>
  );
}

export function FilterPanel({ categories }: { categories: CategoryOption[] }) {
  const search = useSearchParams();
  return (
    <>
      <details className="rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-4 md:hidden">
        <summary className="cursor-pointer list-none font-semibold text-[#26332d] marker:hidden">
          Filter &amp; urutkan
        </summary>
        <form action="/products" className="mt-4 grid gap-3">
          <FilterFields categories={categories} search={search} />
          <button className="rounded-full bg-[#174c3c] py-2.5 font-semibold text-white transition hover:bg-[#103d30]">
            Terapkan filter
          </button>
        </form>
      </details>
      <form
        action="/products"
        className="hidden gap-3 rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-4 md:grid"
      >
        <h2 className="font-semibold text-[#26332d]">Filter barang</h2>
        <FilterFields categories={categories} search={search} />
        <button className="rounded-full bg-[#174c3c] py-2.5 font-semibold text-white transition hover:bg-[#103d30]">
          Terapkan filter
        </button>
      </form>
    </>
  );
}
