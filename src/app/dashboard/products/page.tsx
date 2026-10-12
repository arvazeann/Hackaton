import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { getProductsBySeller } from "@/server/services/products";
import { requireCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/product/cards";
import { formatRupiah } from "@/lib/format";
import { hasPendingOrdersWithoutPaymentAccount } from "@/server/services/profile-hub";
export default async function Dashboard() {
  const user = await requireCurrentUser("/dashboard/products");
  const [products, needsPaymentAccount] = await Promise.all([
    getProductsBySeller(user.id),
    hasPendingOrdersWithoutPaymentAccount(user.id),
  ]);
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">TOKO SAYA</p>
            <h1 className="mt-1 text-3xl font-bold">Produk saya</h1>
          </div>
          <Link
            href="/dashboard/products/new"
            className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          >
            + Jual barang
          </Link>
        </div>
        {needsPaymentAccount && (
          <aside className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">
              Pesanan pending belum bisa dikonfirmasi
            </p>
            <p className="mt-1">
              Tambahkan akun pembayaran aktif agar kamu bisa mengonfirmasi
              pesanan.
            </p>
            <Link
              href="/profile#payments"
              className="mt-2 inline-block font-semibold underline"
            >
              Kelola akun pembayaran
            </Link>
          </aside>
        )}
        <div className="mt-8 divide-y rounded-2xl border bg-white">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <Link href={`/products/${p.id}`} className="font-semibold">
                  {p.title}
                </Link>
                <p className="mt-1 text-sm text-stone-500">
                  {formatRupiah(p.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                <Link
                  href={`/dashboard/products/${p.id}/edit`}
                  className="text-sm font-semibold text-emerald-800"
                >
                  Kelola
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
