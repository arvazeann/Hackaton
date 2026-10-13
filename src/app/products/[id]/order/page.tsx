import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { getProduct } from "@/server/services/products";
import { requireCurrentUser } from "@/lib/session";
import { OrderForm } from "@/components/forms/order-form";
import Link from "next/link";
export default async function Order({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser(`/products/${id}/order`);
  const p = await getProduct(id, user.id);
  if (!p || p.status !== "active" || p.seller.id === user.id) notFound();
  return (
    <Shell>
      <section className="mx-auto max-w-xl px-4 py-12">
        <p className="mb-6 text-sm text-stone-500">Pesanan untuk {p.title}</p>
        {p.seller.isOnVacation ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            Toko sedang libur dan belum menerima pesanan baru. Silakan cek
            kembali nanti.
            {p.seller.storeSlug && (
              <Link
                className="mt-3 block font-semibold underline"
                href={`/store/${p.seller.storeSlug}`}
              >
                Kunjungi toko
              </Link>
            )}
          </div>
        ) : (
          <OrderForm productId={id} />
        )}
      </section>
    </Shell>
  );
}
