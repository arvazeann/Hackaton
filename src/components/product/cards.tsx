import Link from "next/link";
import { ArrowUpRight, Store } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { ProductListItem } from "@/types";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductCardImage } from "@/components/product/product-card-image";
import { ProductCardReveal } from "@/components/product/product-card-reveal";
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
    condition === "fair" ? "bg-fair-bg text-fair-text" : "bg-sage text-primary";

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
  gridClassName = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5",
}: {
  products: ProductListItem[];
  favoriteDisabled?: boolean;
  showOrderAction?: boolean;
  viewerId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { href: string; label: string };
  gridClassName?: string;
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
    <div className={gridClassName}>
      {products.map((product, index) => {
        const metadata = [
          conditionLabels[product.condition] ??
            product.condition.replaceAll("_", " "),
          product.category.name,
          product.city,
        ].filter(Boolean);

        return (
          <ProductCardReveal key={product.id} delay={Math.min(index, 7) * 60}>
            <article className="product-card group/card group relative flex h-full flex-col rounded-3xl bg-peach p-2 shadow-product-card focus-within:z-10">
              <Link
                href={`/products/${product.id}`}
                aria-label={`Lihat ${product.title}`}
                className="product-card-link absolute inset-0 z-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              />
              <div className="pointer-events-none relative isolate aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] bg-peach transform-gpu">
                <ProductCardImage
                  src={product.coverImageUrl}
                  alt={product.title}
                  sizes="(max-width: 1023px) 50vw, 33vw"
                />
                <div className="pointer-events-none absolute left-3 top-3 z-10">
                  {product.status === "active" ? (
                    isNewlyUploaded(product.createdAt) && <NewlyUploadedBadge />
                  ) : (
                    <StatusBadge status={product.status} />
                  )}
                </div>
                <div className="absolute right-2 top-2 z-20 grid size-11 place-items-center">
                  <FavoriteButton
                    productId={product.id}
                    initial={product.isFavorited}
                    loginRequired={favoriteDisabled}
                    variant="product-card"
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="pointer-events-none invisible absolute bottom-3 right-3 z-10 flex size-9 translate-y-2 scale-90 items-center justify-center rounded-full bg-primary text-cream opacity-0 transition-[opacity,translate,scale] duration-control ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:visible group-hover/card:translate-y-0 group-hover/card:scale-100 group-hover/card:opacity-100 group-focus-within/card:visible group-focus-within/card:translate-y-0 group-focus-within/card:scale-100 group-focus-within/card:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animation-none"
                >
                  <ArrowUpRight aria-hidden="true" size={16} />
                </span>
              </div>
              <div className="pointer-events-none relative z-10 px-2 pb-2 pt-3">
                <p className="text-base font-semibold leading-tight text-primary sm:text-lg">
                  {formatRupiah(product.price)}
                </p>
                <p
                  title={product.title}
                  className="mt-1 line-clamp-1 text-sm font-medium leading-snug text-primary sm:text-[15px]"
                >
                  {product.title}
                </p>
                {metadata.length > 0 && (
                  <p className="mt-1 line-clamp-1 text-xs text-primary/65 sm:text-[13px]">
                    {metadata.join(" \u00b7 ")}
                  </p>
                )}
                <div className="mt-3 border-t border-primary/10 pt-3">
                  {product.seller.storeSlug ? (
                    <Link
                      href={`/store/${product.seller.storeSlug}`}
                      className="pointer-events-auto flex min-h-5 max-w-full items-center gap-1.5 truncate text-xs font-medium text-primary/80 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Store
                        aria-hidden="true"
                        size={14}
                        className="shrink-0"
                      />
                      Toko {product.seller.name}
                    </Link>
                  ) : (
                    <p className="flex min-h-5 items-center gap-1.5 truncate text-xs font-medium text-primary/80">
                      <Store
                        aria-hidden="true"
                        size={14}
                        className="shrink-0"
                      />
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
          </ProductCardReveal>
        );
      })}
    </div>
  );
}

export function NewlyUploadedBadge() {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full bg-cream/90 px-2.5 text-xs font-semibold text-primary backdrop-blur-sm">
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
