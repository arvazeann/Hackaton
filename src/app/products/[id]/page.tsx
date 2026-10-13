import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shell } from "@/components/layout/shell";
import { StatusBadge } from "@/components/product/cards";
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
      <section className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:py-10 md:grid-cols-2 md:gap-10">
        <div className="grid grid-cols-2 gap-3 self-start">
          {p.images.map((img, i) => (
            <div
              key={img.id}
              className={`relative aspect-square overflow-hidden rounded-3xl bg-[#eeeae1] p-2 sm:p-4 ${i === 0 ? "col-span-2" : ""}`}
            >
              <Image
                src={img.url}
                alt={`${p.title}, foto ${i + 1}`}
                fill
                className="object-contain"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        <div className="py-1 md:py-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={p.status} />
            <span className="text-sm text-stone-500">
              {p.category.name} · {p.condition.replace("_", " ")}
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-[#26332d]">
            {p.title}
          </h1>
          <p className="mt-3 text-3xl font-bold text-[#174c3c]">
            {formatRupiah(p.price)}
          </p>
          <p className="mt-5 leading-7 text-stone-600">{p.description}</p>
          <div className="mt-7 rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-5 shadow-sm">
            <p className="text-sm text-stone-500">Dijual oleh</p>
            <p className="mt-1 font-semibold">{p.seller.name}</p>
            <p className="text-sm text-stone-500">{p.seller.city}</p>
            {p.seller.storeSlug && (
              <Link
                href={`/store/${p.seller.storeSlug}`}
                className="mt-2 inline-flex text-sm font-semibold text-[#174c3c] underline underline-offset-4"
              >
                Kunjungi toko
              </Link>
            )}
            {p.seller.isOnVacation && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Toko sedang libur dan belum menerima pesanan baru.
              </p>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            {canOrder ? (
              <Link
                href={`/products/${p.id}/order`}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#174c3c] py-3 text-center font-bold text-white transition hover:bg-[#103d30]"
              >
                Pesan barang
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="min-h-12 flex-1 cursor-not-allowed rounded-full bg-[#e7e4dc] py-3 font-bold text-stone-600"
              >
                {isOwner
                  ? "Produk milikmu"
                  : p.seller.isOnVacation
                    ? "Toko sedang libur"
                    : "Tidak tersedia"}
              </button>
            )}
            <div className="grid min-w-12 place-items-center rounded-full border border-[#e3ded2] bg-[#fffefa] px-4">
              <FavoriteButton
                productId={p.id}
                initial={p.isFavorited}
                loginRequired={!user}
              />
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-stone-600">
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
