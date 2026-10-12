"use client";
import { useSearchParams } from "next/navigation";
export function FilterPanel({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  const search = useSearchParams();
  return (
    <form
      action="/products"
      className="grid gap-3 rounded-2xl border bg-white p-4"
    >
      <h2 className="font-semibold">Filter barang</h2>
      <label className="grid gap-1 text-xs text-stone-500">
        Kategori
        <select
          name="category"
          defaultValue={search.get("category") ?? ""}
          className="rounded-lg border p-2 text-sm text-stone-900"
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-stone-500">
        Kondisi
        <select
          name="condition"
          defaultValue={search.get("condition") ?? ""}
          className="rounded-lg border p-2 text-sm text-stone-900"
        >
          <option value="">Semua kondisi</option>
          <option value="like_new">Seperti baru</option>
          <option value="good">Baik</option>
          <option value="fair">Cukup</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="minPrice"
          aria-label="Harga minimum"
          placeholder="Min harga"
          defaultValue={search.get("minPrice") ?? ""}
          className="w-full rounded-lg border p-2 text-sm"
        />
        <input
          name="maxPrice"
          aria-label="Harga maksimum"
          placeholder="Maks harga"
          defaultValue={search.get("maxPrice") ?? ""}
          className="w-full rounded-lg border p-2 text-sm"
        />
      </div>
      <input
        name="city"
        aria-label="Kota"
        placeholder="Kota"
        defaultValue={search.get("city") ?? ""}
        className="rounded-lg border p-2 text-sm"
      />
      <select
        name="sort"
        aria-label="Urutkan"
        defaultValue={search.get("sort") ?? "newest"}
        className="rounded-lg border p-2 text-sm"
      >
        <option value="newest">Terbaru</option>
        <option value="price_asc">Harga terendah</option>
        <option value="price_desc">Harga tertinggi</option>
      </select>
      <input type="hidden" name="q" value={search.get("q") ?? ""} />
      <button className="rounded-full bg-emerald-800 py-2.5 font-semibold text-white">
        Terapkan filter
      </button>
    </form>
  );
}
