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
      <section className="mx-auto max-w-[1536px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {store.isOnVacation && (
          <div className="mb-6 rounded-2xl border border-status-warning-ink bg-status-warning-bg p-4 text-status-warning-ink">
            Toko sedang libur. Produk dapat dilihat, tetapi penjual belum
            menerima pesanan baru.
          </div>
        )}
        <header className="flex flex-col gap-5 border-l-2 border-accent-bright bg-card p-5 sm:flex-row sm:items-center sm:p-6">
          {store.logoUrl ? (
            <Image
              src={store.logoUrl}
              alt={`Logo ${store.storeName}`}
              width={96}
              height={96}
              unoptimized
              className="size-20 rounded-xl object-cover sm:size-24"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid size-20 shrink-0 place-items-center rounded-xl bg-sage-surface text-3xl font-bold text-primary sm:size-24"
            >
              {store.storeName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[.14em] text-primary">
              TOKO
            </p>
            <h1 className="mt-1 font-serif text-3xl text-foreground lg:text-4xl">
              {store.storeName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {store.city}
              {store.province ? `, ${store.province}` : ""} · Bergabung{" "}
              {new Date(store.joinedAt).toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </p>
            {store.description && (
              <p className="mt-3 whitespace-pre-wrap text-foreground">
                {store.description}
              </p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              {store.completedSales} pesanan selesai
            </p>
          </div>
        </header>
        <div className="mt-8">
          <h2 className="mb-5 font-serif text-2xl text-foreground lg:text-3xl">
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
              <span className="self-center text-sm text-muted-foreground">
                {store.page} / {store.totalPages}
              </span>
              {store.page < store.totalPages && (
                <Link
                  className="rounded-full bg-primary px-4 py-2 text-primary-foreground"
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
