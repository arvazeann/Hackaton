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
            <p className="text-xs font-bold tracking-[.14em] text-primary">
              TOKO SAYA
            </p>
            <h1 className="mt-1 font-serif text-3xl text-foreground lg:text-4xl">
              Produk saya
            </h1>
          </div>
          <Link
            href="/dashboard/products/new"
            className="w-fit rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            + Jual barang
          </Link>
        </div>
        {needsPaymentAccount && (
          <aside className="mt-6 rounded-2xl border border-status-warning-ink bg-status-warning-bg p-4 text-sm text-status-warning-ink">
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
        <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {products.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-semibold text-foreground">
                Belum ada produk di tokomu
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Mulai jual barang kos yang sudah tak terpakai.
              </p>
              <Link
                href="/dashboard/products/new"
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
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
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatRupiah(p.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                <Link
                  href={`/dashboard/products/${p.id}/edit`}
                  className="text-sm font-semibold text-primary"
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
