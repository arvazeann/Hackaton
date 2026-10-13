import { Shell } from "@/components/layout/shell";
import { FilterPanel } from "@/components/product/filter";
import { ProductGrid } from "@/components/product/cards";
import { listProducts, getProductCategories } from "@/server/services/products";
import { productQuerySchema } from "@/schemas";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
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
  const pageCount = result.totalPages;
  return (
    <Shell>
      <section className="mx-auto max-w-[1536px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
          KATALOG RUANGLAGI
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-[#342d25] lg:text-4xl">
          Temukan barang favoritmu
        </h1>
        <form action="/products" className="mt-6 md:hidden">
          <input
            name="q"
            defaultValue={query.q}
            placeholder="Cari barang..."
            className="w-full rounded-full border border-[#e3ded2] bg-[#fffefa] p-3"
          />
        </form>
        <div className="mt-6 grid gap-4 md:mt-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
          <aside
            aria-label="Filter katalog"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <FilterPanel categories={categories} />
          </aside>
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#d9d4c8] pb-4 text-sm text-stone-600">
              <p>
                <span className="font-semibold text-[#342d25]">
                  {result.total} barang
                </span>{" "}
                ditemukan{query.q ? ` untuk “${query.q}”` : ""}
              </p>
              <p>
                Halaman {query.page} dari {Math.max(1, pageCount)}
              </p>
            </div>
            <ProductGrid products={result.items} favoriteDisabled={!user} />
            <div className="mt-8 flex justify-center gap-2">
              {query.page > 1 && (
                <Link
                  className="rounded-full border px-4 py-2"
                  href={`/products?${new URLSearchParams({ ...flat, page: String(query.page - 1) })}`}
                >
                  ← Sebelumnya
                </Link>
              )}
              {query.page < pageCount && (
                <Link
                  className="rounded-full bg-emerald-800 px-5 py-2 text-white"
                  href={`/products?${new URLSearchParams({ ...flat, page: String(query.page + 1) })}`}
                >
                  Berikutnya →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
