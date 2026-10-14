"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type CategoryOption = { id: string; name: string; slug: string };
const SLIDER_MAX_PRICE = 2_147_483_647;

function PriceRangeFields() {
  const search = useSearchParams();
  const [minPrice, setMinPrice] = useState(search.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(search.get("maxPrice") ?? "");
  const minNumber = Number(minPrice) || 0;
  const maxNumber = Number(maxPrice) || SLIDER_MAX_PRICE;

  return (
    <fieldset className="grid gap-3">
      <legend className="font-serif text-xl text-foreground">Harga</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Minimum
          <input
            type="number"
            name="minPrice"
            min="0"
            aria-label="Harga minimum"
            placeholder="Rp Min"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="min-h-11 min-w-0 rounded-pill border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Maksimum
          <input
            type="number"
            name="maxPrice"
            min="0"
            aria-label="Harga maksimum"
            placeholder="Rp Maks"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="min-h-11 min-w-0 rounded-pill border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
          />
        </label>
      </div>
      <div className="grid gap-2">
        <label className="grid gap-1 text-xs text-muted-foreground">
          <span>Geser rentang harga</span>
          <input
            type="range"
            min="0"
            max={SLIDER_MAX_PRICE}
            value={Math.min(minNumber, SLIDER_MAX_PRICE)}
            aria-label="Geser harga minimum"
            onChange={(event) => {
              const nextValue = event.target.value;
              setMinPrice(nextValue === "0" ? "" : nextValue);
              if (maxNumber < Number(nextValue)) setMaxPrice(nextValue);
            }}
            className="h-11 w-full cursor-pointer accent-accent-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </label>
        <input
          type="range"
          min={Math.min(minNumber, SLIDER_MAX_PRICE)}
          max={SLIDER_MAX_PRICE}
          value={Math.min(maxNumber, SLIDER_MAX_PRICE)}
          aria-label="Geser harga maksimum"
          onChange={(event) => setMaxPrice(event.target.value)}
          className="h-11 w-full cursor-pointer accent-accent-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>
    </fieldset>
  );
}

function FilterFields({ categories }: { categories: CategoryOption[] }) {
  const search = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(
    search.get("category") ?? "",
  );
  const [selectedCondition, setSelectedCondition] = useState(
    search.get("condition") ?? "",
  );

  return (
    <>
      <fieldset className="grid gap-2">
        <legend className="font-serif text-xl text-foreground">Kategori</legend>
        <div className="grid gap-1">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-pill px-3 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary has-[:checked]:bg-primary has-[:checked]:font-semibold has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-card has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus">
            <input
              type="radio"
              name="category"
              value=""
              checked={!selectedCategory}
              onChange={() => setSelectedCategory("")}
              className="sr-only"
            />
            Semua kategori
          </label>
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-pill px-3 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary has-[:checked]:bg-primary has-[:checked]:font-semibold has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-card has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
            >
              <input
                type="radio"
                name="category"
                value={category.slug}
                checked={selectedCategory === category.slug}
                onChange={() => setSelectedCategory(category.slug)}
                className="sr-only"
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      <PriceRangeFields />

      <fieldset className="grid gap-2">
        <legend className="font-serif text-xl text-foreground">Kondisi</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["", "Semua"],
            ["like_new", "Seperti baru"],
            ["good", "Baik"],
            ["fair", "Cukup"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center rounded-pill border border-border px-3 text-xs font-medium text-foreground transition-colors duration-control ease-soft hover:border-accent-bright has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-card has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
            >
              <input
                type="radio"
                name="condition"
                value={value}
                checked={selectedCondition === value}
                onChange={() => setSelectedCondition(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
        Lokasi
        <input
          name="city"
          aria-label="Kota"
          placeholder="Masukkan kota"
          defaultValue={search.get("city") ?? ""}
          className="min-h-11 rounded-pill border border-border bg-card px-4 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
        />
      </label>
      <input type="hidden" name="q" value={search.get("q") ?? ""} />
      <input type="hidden" name="sort" value={search.get("sort") ?? "newest"} />
      {search.get("pageSize") && (
        <input
          type="hidden"
          name="pageSize"
          value={search.get("pageSize") ?? "12"}
        />
      )}
    </>
  );
}

export function FilterPanel({ categories }: { categories: CategoryOption[] }) {
  const search = useSearchParams();
  const queryKey = search.toString();
  return (
    <>
      <details className="rounded-card border border-border bg-card p-3 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-pill border border-border px-5 text-sm font-semibold text-primary marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
          Filter
        </summary>
        <form action="/products" className="mt-4 grid gap-5 px-1 pb-1">
          <FilterFields key={queryKey} categories={categories} />
          <button className="min-h-11 rounded-pill bg-primary px-5 font-semibold text-primary-foreground transition-colors duration-control ease-soft hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus">
            Terapkan filter
          </button>
        </form>
      </details>
      <form
        action="/products"
        className="hidden gap-5 rounded-card border border-border bg-background p-5 lg:grid"
      >
        <FilterFields key={queryKey} categories={categories} />
        <button className="min-h-11 rounded-pill bg-primary px-5 font-semibold text-primary-foreground transition-colors duration-control ease-soft hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus">
          Terapkan filter
        </button>
      </form>
    </>
  );
}
