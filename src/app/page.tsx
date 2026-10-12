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
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-emerald-950 px-7 py-14 text-white sm:px-14 sm:py-20">
          <div className="relative z-10 max-w-2xl">
            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[.2em]">
              Temukan cerita berikutnya
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
              Barang baik,
              <br />
              <span className="text-emerald-300">cerita baru.</span>
            </h1>
            <p className="mt-5 max-w-lg text-emerald-100">
              Jual dan temukan barang preloved pilihan yang masih punya banyak
              cerita.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-orange-400 px-6 py-3 font-bold text-stone-950"
            >
              Jelajahi barang
            </Link>
          </div>
          <div className="absolute -right-10 -top-28 size-96 rounded-full border-[44px] border-emerald-800/60" />
        </div>
        <div className="py-12">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                PILIHAN UNTUKMU
              </p>
              <h2 className="mt-1 text-2xl font-bold">Jelajahi kategori</h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-emerald-800"
            >
              Semua kategori →
            </Link>
          </div>
          <div className="flex gap-3 overflow-auto pb-2">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="shrink-0 rounded-full border bg-white px-5 py-3 text-sm font-medium hover:border-emerald-600"
              >
                {["✦", "◉", "⌁", "⌂", "▤", "✿", "◎", "♡", "↗", "＋"][i]} {" "}
                {c.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="pb-8">
          <div className="mb-5">
            <p className="text-sm font-semibold text-emerald-700">
              BARU DITEMUKAN
            </p>
            <h2 className="mt-1 text-2xl font-bold">Barang pilihan hari ini</h2>
          </div>
          <ProductGrid products={items.slice(0, 12)} favoriteDisabled={!user} />
        </div>
      </section>
    </Shell>
  );
}
