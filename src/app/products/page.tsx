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
      <section className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm font-semibold text-emerald-700">
          KATALOG RUANGLAGI
        </p>
        <h1 className="mt-1 text-3xl font-bold">Temukan barang favoritmu</h1>
        <form action="/products" className="mt-6 md:hidden">
          <input
            name="q"
            defaultValue={query.q}
            placeholder="Cari barang..."
            className="w-full rounded-full border p-3"
          />
        </form>
        <div className="mt-8 grid gap-7 md:grid-cols-[240px_1fr]">
          <aside>
            <FilterPanel categories={categories} />
          </aside>
          <div>
            <div className="mb-4 flex items-center justify-between text-sm text-stone-500">
              <span>
                {result.total} barang ditemukan
                {query.q ? ` untuk “${query.q}”` : ""}
              </span>
              <span>
                Halaman {query.page} dari {Math.max(1, pageCount)}
              </span>
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
