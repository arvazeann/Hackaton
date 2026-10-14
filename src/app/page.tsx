import Link from "next/link";
import Image from "next/image";
import { Shell } from "@/components/layout/shell";
import { ProductGrid } from "@/components/product/cards";
import { listProducts, getProductCategories } from "@/server/services/products";
import { getCurrentUser } from "@/lib/session";
import { formatRupiah } from "@/lib/format";

export default async function Home() {
  const user = await getCurrentUser();
  const [{ items }, categories] = await Promise.all([
    listProducts({}, user?.id),
    getProductCategories(),
  ]);
  const newestProduct = items[0];
  return (
    <Shell>
      <section className="mx-auto min-w-0 max-w-[1536px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div
          className={`mx-auto grid min-w-0 grid-cols-1 max-w-[1440px] overflow-hidden rounded-2xl bg-primary text-primary-foreground ${newestProduct ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]" : "lg:grid-cols-1"}`}
        >
          <div className="flex min-w-0 flex-col items-start justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-10 lg:py-8">
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-primary-foreground/80">
              PASAR LOAK KONTEMPORER &bull; KHUSUS ANAK KOS
            </span>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl lg:text-5xl">
              Kebutuhan kos,
              <br />
              <span className="text-peach">harga bersahabat.</span>
            </h1>
            <p className="mt-5 max-w-lg leading-7 text-primary-foreground/90">
              Cari furnitur kecil, perlengkapan tidur, alat dapur, elektronik,
              dan kebutuhan belajar preloved dari sesama anak kos.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex min-h-12 items-center rounded-full bg-orange-strong px-6 py-3 font-bold text-primary-foreground transition hover:bg-orange-strong/90 focus-visible:outline-offset-4"
            >
              Cari barang kos
            </Link>
          </div>
          {newestProduct && (
            <Link
              href={`/products/${newestProduct.id}`}
              className="group grid min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-3 p-3 pt-0 focus-visible:outline-offset-[-2px] sm:p-4 sm:pt-0 lg:p-6 lg:pl-0"
            >
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-muted lg:aspect-auto lg:h-[clamp(280px,24vw,340px)]">
                <Image
                  src={newestProduct.coverImageUrl}
                  alt={newestProduct.title}
                  fill
                  priority
                  className="object-contain p-4 transition duration-300 group-hover:scale-[1.02] sm:p-7"
                />
              </div>
              <div className="flex items-end justify-between gap-4 px-1 pb-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary-foreground/80">
                    Pilihan anak kos
                  </p>
                  <h2 className="mt-1 line-clamp-1 text-base sm:text-lg">
                    {newestProduct.title}
                  </h2>
                </div>
                <p className="shrink-0 font-bold text-peach">
                  {formatRupiah(newestProduct.price)}
                </p>
              </div>
            </Link>
          )}
        </div>
        <div className="py-5 sm:py-6 lg:py-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[.14em] text-primary">
                KATEGORI KEBUTUHAN KOS
              </p>
              <h2 className="mt-1 font-serif text-2xl text-foreground lg:text-3xl">
                Cari sesuai kebutuhan
              </h2>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              Semua kategori <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-primary hover:bg-secondary"
              >
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block size-2 rounded-full bg-accent-bright"
                />
                {category.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="pb-8">
          <div className="mb-5">
            <p className="text-xs font-bold tracking-[.14em] text-primary">
              BARU MASUK
            </p>
            <h2 className="mt-1 font-serif text-2xl text-foreground lg:text-3xl">
              Temuan baru buat kamar kos
            </h2>
          </div>
          <ProductGrid
            products={items.slice(newestProduct ? 1 : 0, 12)}
            favoriteDisabled={!user}
          />
        </div>
      </section>
    </Shell>
  );
}
