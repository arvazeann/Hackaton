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
  return (
    <Shell>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {p.images.map((img, i) => (
            <div
              key={img.id}
              className={`relative aspect-square overflow-hidden rounded-3xl bg-stone-100 ${i === 0 ? "col-span-2" : ""}`}
            >
              <Image
                src={img.url}
                alt={`${p.title}, foto ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        <div className="py-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={p.status} />
            <span className="text-sm text-stone-500">
              {p.category.name} · {p.condition.replace("_", " ")}
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-bold">{p.title}</h1>
          <p className="mt-3 text-3xl font-bold text-emerald-800">
            {formatRupiah(p.price)}
          </p>
          <p className="mt-5 leading-7 text-stone-600">{p.description}</p>
          <div className="mt-7 rounded-2xl border p-4">
            <p className="text-sm text-stone-500">Dijual oleh</p>
            <p className="mt-1 font-semibold">{p.seller.name}</p>
            <p className="text-sm text-stone-500">{p.seller.city}</p>
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/products/${p.id}/order`}
              aria-disabled={p.status !== "active" || isOwner}
              className={`flex-1 rounded-full py-3 text-center font-bold text-white ${p.status === "active" && !isOwner ? "bg-emerald-800" : "pointer-events-none bg-stone-400"}`}
            >
              {p.status === "active" ? "Pesan barang" : "Tidak tersedia"}
            </Link>
            <div className="grid place-items-center rounded-full border px-5">
              <FavoriteButton
                productId={p.id}
                initial={p.isFavorited}
                disabled={!user}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-stone-500">
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
