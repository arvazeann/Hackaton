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
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
              TOKO SAYA
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-[#342d25] lg:text-4xl">
              Produk saya
            </h1>
          </div>
          <Link
            href="/dashboard/products/new"
            className="w-fit rounded-full bg-[#174c3c] px-5 py-3 font-semibold text-white transition hover:bg-[#103d30]"
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
        <div className="mt-8 divide-y divide-[#e3ded2] overflow-hidden rounded-2xl border border-[#e3ded2] bg-[#fffefa]">
          {products.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-semibold text-[#26332d]">
                Belum ada produk di tokomu
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Mulai jual barang kos yang sudah tak terpakai.
              </p>
              <Link
                href="/dashboard/products/new"
                className="mt-4 inline-flex rounded-full bg-[#174c3c] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Tambah produk
              </Link>
            </div>
          )}
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
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
