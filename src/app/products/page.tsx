import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { productQuerySchema } from "@/schemas";
import { listProducts, getProductCategories } from "@/server/services/products";
import { FilterPanel } from "@/components/product/filter";
import { ProductGrid } from "@/components/product/cards";
import { ProductPagination } from "@/components/product/pagination";
import { Shell } from "@/components/layout/shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flat: Record<string, string> = Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      const normalized = Array.isArray(value) ? value[0] : value;
      return typeof normalized === "string" ? [[key, normalized]] : [];
    }),
  );
  const parsed = productQuerySchema.safeParse(flat);
  const query = parsed.success
    ? parsed.data
    : { sort: "newest" as const, page: 1, pageSize: 12 };
  const user = await getCurrentUser();
  const [result, categories] = await Promise.all([
    listProducts(query, user?.id),
    getProductCategories(),
  ]);

  return (
    <Shell>
      <section className="mx-auto max-w-[1536px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="text-xs font-bold tracking-[.14em] text-primary">
          PASAR LOAK KONTEMPORER
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground lg:text-4xl">
          Temukan kebutuhan kos preloved
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-border bg-card p-3 sm:p-4">
          <p className="shrink-0 px-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {result.total}
            </span>{" "}
            barang
          </p>
          <form
            action="/products"
            role="search"
            className="flex min-w-full flex-1 items-center gap-2 sm:min-w-[16rem]"
          >
            <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-focus/20">
              <Search
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <input
                name="q"
                aria-label="Cari barang"
                defaultValue={query.q}
                placeholder="Cari meja, rice cooker, lampu..."
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <label className="sr-only" htmlFor="catalog-sort">
              Urutkan
            </label>
            <Select name="sort" defaultValue={query.sort}>
              <SelectTrigger id="catalog-sort" aria-label="Urutkan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="price_asc">Harga terendah</SelectItem>
                <SelectItem value="price_desc">Harga tertinggi</SelectItem>
              </SelectContent>
            </Select>
            {Object.entries(flat)
              .filter(([key]) => !["q", "sort", "page"].includes(key))
              .map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
            <button
              aria-label="Cari dan urutkan"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Search aria-hidden="true" size={17} />
            </button>
          </form>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
          <aside
            aria-label="Filter katalog"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <FilterPanel categories={categories} />
          </aside>
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">
                  {result.total} barang
                </span>{" "}
                ditemukan{query.q ? ` untuk “${query.q}”` : ""}
              </p>
              <p>
                Halaman {query.page} dari {Math.max(1, result.totalPages)}
              </p>
            </div>
            <ProductGrid products={result.items} favoriteDisabled={!user} />
            <ProductPagination
              page={query.page}
              pageCount={result.totalPages}
              searchParams={flat}
            />
          </div>
        </div>
      </section>
    </Shell>
  );
}
