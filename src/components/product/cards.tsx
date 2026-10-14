import Link from "next/link";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";
import type { ProductListItem } from "@/types";
import { FavoriteButton } from "@/components/product/favorite-button";
import { buttonVariants } from "@/components/ui/button";

export const NEWLY_UPLOADED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewlyUploaded(createdAt: string, now = Date.now()) {
  const uploadedAt = Date.parse(createdAt);
  const age = now - uploadedAt;
  return (
    Number.isFinite(uploadedAt) && age >= 0 && age <= NEWLY_UPLOADED_WINDOW_MS
  );
}

const conditionLabels: Record<string, string> = {
  like_new: "Seperti baru",
  good: "Baik",
  fair: "Cukup",
};

export function ConditionBadge({ condition }: { condition: string }) {
  const appearance =
    condition === "fair"
      ? "bg-fair-bg text-fair-text"
      : "bg-sage text-primary";

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-pill px-3 text-xs font-semibold ${appearance}`}
    >
      {conditionLabels[condition] ?? condition.replaceAll("_", " ")}
    </span>
  );
}

export function ProductGrid({
  products,
  favoriteDisabled = false,
  showOrderAction = false,
  viewerId,
  emptyTitle = "Belum ada barang yang cocok",
  emptyDescription = "Coba ubah kata kunci atau filter pencarian.",
  emptyAction,
}: {
  products: ProductListItem[];
  favoriteDisabled?: boolean;
  showOrderAction?: boolean;
  viewerId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { href: string; label: string };
}) {
  if (!products.length)
    return (
      <div className="rounded-card border border-dashed border-border bg-card px-6 py-14 text-center sm:px-12">
        <p className="font-serif text-xl text-foreground">{emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {emptyDescription}
        </p>
        {emptyAction && (
          <Link
            href={emptyAction.href}
            className="mt-5 inline-flex min-h-11 items-center rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-control ease-soft hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
          >
            {emptyAction.label}
          </Link>
        )}
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
      {products.map((product) => (
        <article
          key={product.id}
          className="group/card group relative flex h-full flex-col rounded-card border border-transparent bg-peach p-2.5 transition-[transform,border-color,box-shadow] duration-control ease-soft hover:-translate-y-0.5 hover:border-accent-bright hover:shadow-card focus-within:-translate-y-0.5 focus-within:border-accent-bright focus-within:shadow-card motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0 sm:p-3"
        >
          <Link
            href={`/products/${product.id}`}
            aria-label={`Lihat ${product.title}`}
            className="absolute inset-0 z-0 rounded-card focus-visible:outline-offset-[-4px]"
          />
          <div className="pointer-events-none relative aspect-[4/3] overflow-hidden rounded-image bg-cream">
            {product.coverImageUrl.trim() ? (
              <Image
                src={product.coverImageUrl}
                alt={product.title}
                fill
                sizes="(max-width: 1023px) 50vw, 33vw"
                className="object-contain p-3 transition-transform duration-image ease-soft group-hover/card:scale-[1.03] group-focus-within/card:scale-[1.03] motion-reduce:transition-none sm:p-4"
              />
            ) : (
              <div className="grid size-full place-items-center bg-background">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 100"
                  className="w-1/2 max-w-32 text-primary"
                  fill="none"
                >
                  <circle cx="60" cy="48" r="40" fill="var(--background)" />
                  <path
                    d="M36 56h48l-4-26a5 5 0 0 0-5-4H45a5 5 0 0 0-5 4l-4 26Z"
                    fill="currentColor"
                  />
                  <path
                    d="M32 56h56v8a7 7 0 0 1-7 7H39a7 7 0 0 1-7-7v-8Z"
                  fill="var(--peach)"
                  />
                  <circle cx="60" cy="43" r="9" fill="var(--card)" />
                </svg>
                <span className="sr-only">Gambar belum tersedia</span>
              </div>
            )}
            <div className="pointer-events-none absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
              {product.status === "active" ? (
                isNewlyUploaded(product.createdAt) && <NewlyUploadedBadge />
              ) : (
                <StatusBadge status={product.status} />
              )}
            </div>
            <span className="pointer-events-none absolute bottom-2 left-2 z-10 sm:bottom-3 sm:left-3">
              <ConditionBadge condition={product.condition} />
            </span>
            <div className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3">
              <FavoriteButton
                productId={product.id}
                initial={product.isFavorited}
                loginRequired={favoriteDisabled}
              />
            </div>
          </div>
          <div className="pointer-events-none relative z-10 flex flex-1 flex-col px-1.5 pb-1 pt-3 sm:px-2 sm:pt-4">
            <Link
              href={`/products/${product.id}`}
              className="pointer-events-auto line-clamp-2 block min-h-11 rounded text-sm font-semibold leading-5 text-foreground transition-colors duration-control ease-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
            >
              {product.title}
            </Link>
            <p className="mt-1 text-sm font-bold tracking-tight text-primary sm:text-base">
              {formatRupiah(product.price)}
            </p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {product.category.name} <span aria-hidden="true">·</span>{" "}
              {product.city}
            </p>
            <div className="mt-auto min-h-7 pt-2">
              {product.seller.storeSlug ? (
                <Link
                  href={`/store/${product.seller.storeSlug}`}
                  className="pointer-events-auto inline-flex min-h-11 max-w-full items-center truncate rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Toko {product.seller.name}
                </Link>
              ) : (
                <p className="truncate text-xs text-muted-foreground">
                  {product.seller.name}
                </p>
              )}
            </div>
            {showOrderAction &&
              (product.status === "active" &&
              product.seller.id !== viewerId &&
              !product.seller.isOnVacation ? (
                <Link
                  href={`/products/${product.id}/order`}
                  className={`${buttonVariants({ variant: "accent", size: "lg" })} pointer-events-auto mt-3 w-full text-center`}
                >
                  Pesan produk
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="pointer-events-auto mt-3 min-h-11 w-full cursor-not-allowed rounded-pill bg-muted px-3 text-xs font-semibold text-muted-foreground"
                >
                  {product.seller.id === viewerId
                    ? "Produk milikmu"
                    : product.seller.isOnVacation
                      ? "Toko sedang libur"
                      : "Tidak dapat dipesan"}
                </button>
              ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function NewlyUploadedBadge() {
  return (
    <span className="inline-flex min-h-7 items-center rounded-pill bg-sage px-3 text-xs font-semibold text-primary">
      Baru diunggah
    </span>
  );
}

const statusLabels: Record<string, string> = {
  active: "Tersedia",
  reserved: "Dipesan",
  sold: "Terjual",
  archived: "Diarsipkan",
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const statusStyles: Record<string, string> = {
  active: "bg-sage text-primary",
  reserved: "bg-status-warning-bg text-status-warning-ink",
  sold: "bg-muted text-foreground",
  archived: "bg-muted text-muted-foreground",
  pending: "bg-status-warning-bg text-status-warning-ink",
  confirmed: "bg-sage text-primary",
  completed: "bg-sage text-primary",
  rejected: "bg-status-error-bg text-status-error-ink",
  cancelled: "bg-muted text-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-pill px-3 text-xs font-semibold ${statusStyles[status] ?? "bg-muted text-foreground"}`}
    >
      {statusLabels[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}
