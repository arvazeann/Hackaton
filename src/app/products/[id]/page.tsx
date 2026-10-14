import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shell } from "@/components/layout/shell";
import { ConditionBadge, StatusBadge } from "@/components/product/cards";
import { getProduct } from "@/server/services/products";
import { formatRupiah } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { FavoriteButton } from "@/components/product/favorite-button";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const p = await getProduct(id, user?.id);
  if (!p) notFound();
  const isOwner = p.seller.id === user?.id;
  const canOrder = p.status === "active" && !isOwner && !p.seller.isOnVacation;
  return (
    <Shell>
      <section className="mx-auto grid max-w-7xl gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8 md:grid-cols-[1.05fr_.95fr] md:gap-12">
        <div className="grid grid-cols-2 gap-3 self-start">
          {p.images.map((img, i) => (
            <div
              key={img.id}
              className={`relative overflow-hidden rounded-2xl bg-muted p-3 sm:p-5 ${i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
            >
              <Image
                src={img.url}
                alt={`${p.title}, foto ${i + 1}`}
                fill
                unoptimized
                className="object-contain"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        <div className="py-1 md:py-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={p.status} />
            <ConditionBadge condition={p.condition} />
            <span className="text-sm text-muted-foreground">
              {p.category.name} <span aria-hidden="true">·</span> {p.city}
            </span>
          </div>
          <h1 className="mt-5 font-serif text-3xl leading-tight text-foreground lg:text-4xl">
            {p.title}
          </h1>
          <p className="mt-4 text-3xl font-bold tracking-tight text-primary lg:text-4xl">
            {formatRupiah(p.price)}
          </p>
          <div className="mt-6 border-t border-border pt-5">
            <h2 className="text-xs uppercase tracking-[.12em] text-muted-foreground">
              Deskripsi barang
            </h2>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-foreground">
              {p.description}
            </p>
          </div>
          <div className="mt-6 border-l-2 border-accent-bright bg-muted px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
              Penjual
            </p>
            <p className="mt-1 font-semibold">{p.seller.name}</p>
            <p className="text-sm text-muted-foreground">{p.seller.city}</p>
            {p.seller.storeSlug && (
              <Link
                href={`/store/${p.seller.storeSlug}`}
                className="mt-2 inline-flex text-sm font-semibold text-primary underline underline-offset-4"
              >
                Kunjungi toko
              </Link>
            )}
            {p.seller.isOnVacation && (
              <p className="mt-3 border-l-2 border-status-warning-ink bg-status-warning-bg p-3 text-sm text-status-warning-ink">
                Toko sedang libur dan belum menerima pesanan baru.
              </p>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            {canOrder ? (
              <Link
                href={`/products/${p.id}/order`}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary py-3 text-center font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Pesan barang
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="min-h-12 flex-1 cursor-not-allowed rounded-full bg-muted py-3 font-bold text-muted-foreground"
              >
                {isOwner
                  ? "Produk milikmu"
                  : p.seller.isOnVacation
                    ? "Toko sedang libur"
                    : "Tidak tersedia"}
              </button>
            )}
            <div className="grid min-w-12 place-items-center rounded-full border border-border bg-card px-4">
              <FavoriteButton
                productId={p.id}
                initial={p.isFavorited}
                loginRequired={!user}
              />
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {p.status !== "active"
              ? "Produk ini sudah dipesan atau terjual."
              : isOwner
                ? "Ini produk milikmu."
                : "Pembayaran dan pengiriman diatur langsung dengan penjual."}
          </p>
        </div>
      </section>
    </Shell>
  );
}
