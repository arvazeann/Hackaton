import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { ProductGrid } from "@/components/product/cards";
import { listProducts, getProductCategories } from "@/server/services/products";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();
  const [{ items }, categories] = await Promise.all([
    listProducts({}, user?.id),
    getProductCategories(),
  ]);
  return (
    <Shell>
      <section className="mx-auto max-w-[1536px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#174c3c] px-6 py-12 text-white shadow-[0_18px_50px_rgba(23,76,60,0.16)] sm:px-14 sm:py-20 lg:px-20 lg:py-24">
          <div className="relative z-10 max-w-3xl">
            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em]">
              Temukan cerita berikutnya
            </span>
            <h1 className="mt-6 font-serif text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Barang baik,
              <br />
              <span className="text-[#f2b46d]">cerita baru.</span>
            </h1>
            <p className="mt-5 max-w-lg leading-7 text-[#e5eee8]">
              Jual dan temukan barang preloved pilihan yang masih punya banyak
              cerita.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#a65b3f] px-6 py-3 font-bold text-white shadow-sm transition hover:bg-[#914b34] focus-visible:outline-offset-4"
            >
              Jelajahi barang
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-36 hidden size-[28rem] rounded-full border-[44px] border-white/10 sm:block"
          />
        </div>
        <div className="py-10 sm:py-12 lg:py-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
                PILIHAN UNTUKMU
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#342d25] lg:text-3xl">
                Jelajahi kategori
              </h2>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-[#174c3c] hover:underline"
            >
              Semua kategori →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="shrink-0 rounded-full border border-[#e3ded2] bg-[#fffefa] px-5 py-3 text-sm font-medium text-[#34453b] shadow-sm transition hover:border-[#568270] hover:bg-[#edf2ec]"
              >
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block size-2 rounded-full bg-[#e99a45]"
                />
                {category.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="pb-8">
          <div className="mb-5">
            <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
              BARU DITEMUKAN
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#342d25] lg:text-3xl">
              Barang pilihan hari ini
            </h2>
          </div>
          <ProductGrid products={items.slice(0, 12)} favoriteDisabled={!user} />
        </div>
      </section>
    </Shell>
  );
}
