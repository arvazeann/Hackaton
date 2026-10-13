import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { ProductGrid } from "@/components/product/cards";
import { getCurrentUser } from "@/lib/session";
import { productQuerySchema } from "@/schemas";
import { getPublicStore } from "@/server/services/products";

export default async function PublicStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const flat = Object.fromEntries(
    Object.entries(search).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const parsed = productQuerySchema.safeParse(flat);
  const query = parsed.success
    ? parsed.data
    : { sort: "newest" as const, page: 1, pageSize: 12 };
  const user = await getCurrentUser();
  const store = await getPublicStore(slug, query, user?.id);
  if (!store) notFound();
  return (
    <Shell>
      <section className="mx-auto max-w-7xl px-4 py-10">
        {store.isOnVacation && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
            Toko sedang libur. Produk dapat dilihat, tetapi penjual belum
            menerima pesanan baru.
          </div>
        )}
        <header className="flex flex-col gap-5 rounded-3xl border border-[#e3ded2] bg-[#fffefa] p-5 shadow-sm sm:flex-row sm:items-center sm:p-7">
          {store.logoUrl ? (
            <Image
              src={store.logoUrl}
              alt={`Logo ${store.storeName}`}
              width={96}
              height={96}
              unoptimized
              className="size-24 rounded-2xl object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid size-24 shrink-0 place-items-center rounded-2xl bg-[#e6eee7] text-3xl font-bold text-[#174c3c]"
            >
              {store.storeName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
              TOKO
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#26332d]">
              {store.storeName}
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              {store.city}
              {store.province ? `, ${store.province}` : ""} · Bergabung{" "}
              {new Date(store.joinedAt).toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </p>
            {store.description && (
              <p className="mt-3 whitespace-pre-wrap text-stone-700">
                {store.description}
              </p>
            )}
            <p className="mt-3 text-sm text-stone-500">
              {store.completedSales} pesanan selesai
            </p>
          </div>
        </header>
        <div className="mt-10">
          <h2 className="mb-5 text-2xl font-bold text-[#26332d]">
            Produk aktif
          </h2>
          <ProductGrid
            products={store.products}
            favoriteDisabled={!user}
            emptyTitle="Belum ada produk aktif"
            emptyDescription="Produk aktif dari toko ini akan tampil di sini."
            emptyAction={{ href: "/products", label: "Jelajahi marketplace" }}
          />
          {store.totalPages > 1 && (
            <nav
              aria-label="Halaman produk toko"
              className="mt-8 flex justify-center gap-3"
            >
              {store.page > 1 && (
                <Link
                  className="rounded-full border px-4 py-2"
                  href={`/store/${store.slug}?page=${store.page - 1}&pageSize=${store.pageSize}`}
                >
                  Sebelumnya
                </Link>
              )}
              <span className="self-center text-sm text-stone-600">
                {store.page} / {store.totalPages}
              </span>
              {store.page < store.totalPages && (
                <Link
                  className="rounded-full bg-emerald-800 px-4 py-2 text-white"
                  href={`/store/${store.slug}?page=${store.page + 1}&pageSize=${store.pageSize}`}
                >
                  Berikutnya
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>
    </Shell>
  );
}
