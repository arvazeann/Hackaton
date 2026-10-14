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
          className={`mx-auto grid min-w-0 grid-cols-1 max-w-[1440px] overflow-hidden rounded-2xl bg-[#174c3c] text-white ${newestProduct ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]" : "lg:grid-cols-1"}`}
        >
          <div className="flex min-w-0 flex-col items-start justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-10 lg:py-8">
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-[#c6d8cc]">
              PASAR LOAK KONTEMPORER • KHUSUS ANAK KOS
            </span>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-6xl lg:text-5xl">
              Kebutuhan kos,
              <br />
              <span className="text-[#f2b46d]">harga bersahabat.</span>
            </h1>
            <p className="mt-5 max-w-lg leading-7 text-[#e5eee8]">
              Cari furnitur kecil, perlengkapan tidur, alat dapur, elektronik,
              dan kebutuhan belajar preloved dari sesama anak kos.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#a65b3f] px-6 py-3 font-bold text-white transition hover:bg-[#914b34] focus-visible:outline-offset-4"
            >
              Cari barang kos
            </Link>
          </div>
          {newestProduct && (
            <Link
              href={`/products/${newestProduct.id}`}
              className="group grid min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-3 p-3 pt-0 focus-visible:outline-offset-[-2px] sm:p-4 sm:pt-0 lg:p-6 lg:pl-0"
            >
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-[#f0ede5] lg:aspect-auto lg:h-[clamp(280px,24vw,340px)]">
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
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#c6d8cc]">
                    Pilihan anak kos
                  </p>
                  <h2 className="mt-1 line-clamp-1 text-base font-semibold sm:text-lg">
                    {newestProduct.title}
                  </h2>
                </div>
                <p className="shrink-0 font-bold text-[#f2b46d]">
                  {formatRupiah(newestProduct.price)}
                </p>
              </div>
            </Link>
          )}
        </div>
        <div className="py-5 sm:py-6 lg:py-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
                KATEGORI KEBUTUHAN KOS
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#342d25] lg:text-3xl">
                Cari sesuai kebutuhan
              </h2>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-[#174c3c] hover:underline"
            >
              Semua kategori <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="shrink-0 rounded-full border border-[#e3ded2] bg-[#fffefa] px-5 py-2.5 text-sm font-medium text-[#34453b] shadow-sm transition hover:border-[#568270] hover:bg-[#edf2ec]"
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
              BARU MASUK
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#342d25] lg:text-3xl">
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
