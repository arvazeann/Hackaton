import Link from "next/link";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";
import type { ProductListItem } from "@/types";
import { FavoriteButton } from "@/components/product/favorite-button";

const conditionLabels: Record<string, string> = {
  like_new: "Seperti baru",
  good: "Baik",
  fair: "Cukup",
};

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span className="rounded-full border border-[#e3ded2] bg-[#fffefa] px-2.5 py-1 text-[11px] font-semibold text-[#342d25]">
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
      <div className="rounded-3xl border border-dashed border-[#d6d0c3] bg-[#fffefa] px-6 py-14 text-center sm:px-12">
        <p className="text-lg font-semibold text-[#26332d]">{emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
          {emptyDescription}
        </p>
        {emptyAction && (
          <Link
            href={emptyAction.href}
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#174c3c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103d30]"
          >
            {emptyAction.label}
          </Link>
        )}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <article
          key={p.id}
          className="group flex h-full flex-col overflow-hidden rounded-xl border border-transparent transition duration-200 hover:border-[#e3ded2] hover:bg-[#fffefa] hover:shadow-[0_10px_24px_rgba(39,52,44,0.08)]"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#eeeae1]">
            <Link
              href={`/products/${p.id}`}
              aria-label={`Lihat ${p.title}`}
              className="absolute inset-0 z-0 rounded-xl focus-visible:outline-offset-[-4px]"
            />
            <Image
              src={p.coverImageUrl}
              alt={p.title}
              fill
              className="pointer-events-none object-contain p-2 transition duration-300 group-hover:scale-[1.02] sm:p-3"
            />
            {p.status !== "active" && (
              <div className="pointer-events-none absolute left-3 top-3 z-10">
                <StatusBadge status={p.status} />
              </div>
            )}
            <span className="pointer-events-none absolute bottom-3 left-3 z-10">
              <ConditionBadge condition={p.condition} />
            </span>
            <div className="absolute right-3 top-3 z-10 rounded-full border border-[#e3ded2] bg-[#fffefa] p-2">
              <FavoriteButton
                productId={p.id}
                initial={p.isFavorited}
                loginRequired={favoriteDisabled}
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3 sm:px-2 sm:pt-4">
            <Link
              href={`/products/${p.id}`}
              className="line-clamp-2 block min-h-10 text-sm font-semibold leading-5 text-[#342d25] hover:text-[#174c3c]"
            >
              {p.title}
            </Link>
            <p className="mt-2 text-base font-bold tracking-tight text-[#174c3c] sm:text-lg">
              {formatRupiah(p.price)}
            </p>
            <p className="mt-1 line-clamp-1 text-xs text-stone-600">
              {p.category.name} <span aria-hidden="true">·</span> {p.city}
            </p>
            <div className="mt-auto min-h-7 pt-2">
              {p.seller.storeSlug ? (
                <Link
                  href={`/store/${p.seller.storeSlug}`}
                  className="block truncate text-xs font-semibold text-[#568270] hover:text-[#174c3c] hover:underline"
                >
                  Toko {p.seller.name}
                </Link>
              ) : (
                <p className="truncate text-xs text-stone-500">
                  {p.seller.name}
                </p>
              )}
            </div>
            {showOrderAction &&
              (p.status === "active" &&
              p.seller.id !== viewerId &&
              !p.seller.isOnVacation ? (
                <Link
                  href={`/products/${p.id}/order`}
                  className="mt-3 block rounded-full bg-[#174c3c] px-3 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-[#103d30] focus-visible:outline-offset-2"
                >
                  Pesan produk
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-3 block w-full cursor-not-allowed rounded-full bg-stone-200 px-3 py-2 text-xs font-semibold text-stone-600"
                >
                  {p.seller.id === viewerId
                    ? "Produk milikmu"
                    : p.seller.isOnVacation
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

export function StatusBadge({ status }: { status: string }) {
  const style: Record<string, string> = {
    active: "bg-[#e6eee7] text-[#174c3c]",
    reserved: "bg-[#f7e9ce] text-[#6e4b19]",
    sold: "bg-[#eeeae1] text-[#524d46]",
    archived: "bg-stone-100 text-stone-600",
    pending: "bg-[#f7e9ce] text-[#6e4b19]",
    confirmed: "bg-[#e5edf0] text-[#315562]",
    completed: "bg-[#e6eee7] text-[#174c3c]",
    rejected: "bg-[#f8e7e4] text-[#8a4032]",
    cancelled: "bg-[#eeeae1] text-[#524d46]",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style[status] ?? "bg-stone-100"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
