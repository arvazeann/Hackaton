import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { ProductGrid } from "@/components/product/cards";
import { listProducts, getProductCategories } from "@/server/services/products";
import { getCurrentUser } from "@/lib/session";
import { formatRupiah } from "@/lib/format";
import { HeroFeaturedImage } from "@/components/home/hero-featured-image";

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
          className={`relative isolate mx-auto grid min-w-0 grid-cols-1 max-w-[1440px] overflow-hidden rounded-2xl bg-primary text-primary-foreground ${newestProduct ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]" : "lg:grid-cols-1"}`}
        >
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 size-full text-primary-foreground/[0.08]"
            viewBox="0 0 1440 520"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 72H1440M0 172H1440M0 272H1440M0 372H1440M0 472H1440"
              stroke="currentColor"
              strokeDasharray="2 12"
            />
            <path
              d="M160 0V520M400 0V520M640 0V520M880 0V520M1120 0V520M1360 0V520"
              stroke="currentColor"
              strokeDasharray="2 14"
            />
            <path
              d="M0 154C112 154 138 104 234 112S344 198 448 182 575 96 684 118 812 208 922 178 1058 82 1168 112 1314 182 1440 118"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M0 344C98 344 142 400 238 392S354 292 454 306 576 404 686 380 802 278 910 296 1034 404 1140 376 1300 282 1440 308"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M0 452C124 440 186 468 292 444S418 410 526 434 644 478 756 448 876 408 986 432 1110 478 1220 448 1350 416 1440 430"
              stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray="3 9"
            />
            <path
              d="M84 154v-18m18 18v-30m18 30v-12m18 12v-44m18 44v-24M1284 308v-22m18 22v-38m18 38v-16m18 16v-52m18 52v-28"
              stroke="currentColor"
              strokeLinecap="round"
            />
            <path
              d="M144 112h84m-42-42v84M684 118h94m-47-47v94M1168 112h84m-42-42v84M454 306h88m-44-44v88M910 296h88m-44-44v88"
              stroke="currentColor"
              strokeDasharray="2 8"
            />
            <circle cx="234" cy="112" r="5" fill="currentColor" />
            <circle cx="448" cy="182" r="5" fill="currentColor" />
            <circle cx="684" cy="118" r="5" fill="currentColor" />
            <circle cx="922" cy="178" r="5" fill="currentColor" />
            <circle cx="1168" cy="112" r="5" fill="currentColor" />
            <circle cx="238" cy="392" r="5" fill="currentColor" />
            <circle cx="454" cy="306" r="5" fill="currentColor" />
            <circle cx="686" cy="380" r="5" fill="currentColor" />
            <circle cx="910" cy="296" r="5" fill="currentColor" />
            <circle cx="1140" cy="376" r="5" fill="currentColor" />
            <path
              d="M-54 234a210 210 0 0 1 418 0M1076 246a184 184 0 0 1 368 0"
              stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray="3 10"
            />
            <g stroke="currentColor" strokeLinecap="round">
              <circle cx="118" cy="274" r="38" strokeDasharray="2 8" />
              <circle cx="118" cy="274" r="22" />
              <path d="M98 274h40M118 254v40" />
              <circle cx="736" cy="246" r="54" strokeDasharray="2 9" />
              <circle cx="736" cy="246" r="7" fill="currentColor" />
              <path d="M716 246h40M736 226v40" />
              <circle cx="1306" cy="238" r="46" />
              <circle cx="1306" cy="238" r="28" strokeDasharray="2 7" />
              <path d="M1288 238h36M1306 220v36" />
              <path d="M310 76v18m-9-9h18M1010 422v18m-9-9h18M590 286v14m-7-7h14M119 438v14m-7-7h14" />
            </g>
            <g fill="currentColor">
              <circle cx="332" cy="248" r="3" />
              <circle cx="556" cy="214" r="3" />
              <circle cx="842" cy="412" r="3" />
              <circle cx="1030" cy="194" r="3" />
              <circle cx="1220" cy="286" r="3" />
              <circle cx="1382" cy="404" r="3" />
            </g>
          </svg>
          <div className="relative z-10 flex min-w-0 flex-col items-start justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-10 lg:py-8">
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-primary-foreground/80">
              PASAR LOAK KONTEMPORER &bull; KHUSUS ANAK KOS
            </span>
            <h1 className="mt-4 font-heading text-[clamp(51px,5.25vw,73px)] font-normal leading-none tracking-[-0.03em]">
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
              className="group relative z-10 mx-auto block aspect-[4/5] w-full max-w-[448px] rounded-t-[170px] rounded-b-[22px] bg-peach p-2.5 focus-visible:outline-offset-[-2px] lg:my-auto"
            >
              <div className="relative size-full overflow-hidden rounded-t-[160px] rounded-b-[16px] bg-sage">
                <HeroFeaturedImage
                  key={newestProduct.id}
                  src={newestProduct.coverImageUrl}
                  alt={newestProduct.title}
                  sizes="(max-width: 1023px) 100vw, 448px"
                  priority
                />
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-cream/95 p-4 text-foreground shadow-card sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">
                  Pilihan anak kos
                </p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <h2 className="line-clamp-2 min-w-0 text-base leading-tight sm:text-lg">
                    {newestProduct.title}
                  </h2>
                  <p className="shrink-0 font-bold text-primary">
                    {formatRupiah(newestProduct.price)}
                  </p>
                </div>
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
            gridClassName="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-5"
          />
        </div>
      </section>
    </Shell>
  );
}
