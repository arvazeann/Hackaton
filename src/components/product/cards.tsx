import Link from "next/link";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";
import type { ProductListItem } from "@/types";
import { FavoriteButton } from "@/components/product/favorite-button";
export function ProductGrid({
  products,
  favoriteDisabled = false,
  emptyTitle = "Belum ada barang yang cocok",
  emptyDescription = "Coba ubah kata kunci atau filter pencarian.",
}: {
  products: ProductListItem[];
  favoriteDisabled?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!products.length)
    return (
      <div className="rounded-3xl border border-dashed p-16 text-center">
        <p className="text-lg font-semibold">{emptyTitle}</p>
        <p className="mt-2 text-sm text-stone-500">{emptyDescription}</p>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/products/${p.id}`}
          className="group overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="relative aspect-[4/3] bg-stone-100">
            <Image
              src={p.coverImageUrl}
              alt={p.title}
              fill
              className="object-cover transition group-hover:scale-[1.03]"
            />
            <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2">
              <FavoriteButton
                productId={p.id}
                initial={p.isFavorited}
                disabled={favoriteDisabled}
              />
            </div>
          </div>
          <div className="space-y-1 p-3">
            <p className="line-clamp-2 min-h-10 text-sm font-semibold">
              {p.title}
            </p>
            <p className="font-bold text-emerald-800">
              {formatRupiah(p.price)}
            </p>
            <p className="text-xs text-stone-500">
              {p.city} · {p.category.name}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const style: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    reserved: "bg-amber-100 text-amber-900",
    sold: "bg-stone-200 text-stone-700",
    archived: "bg-stone-100 text-stone-600",
    pending: "bg-amber-100 text-amber-900",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-stone-200 text-stone-700",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style[status] ?? "bg-stone-100"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
