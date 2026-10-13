import { Shell } from "@/components/layout/shell";
import { getOrders } from "@/server/services/orders";
import { requireCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/product/cards";
import { formatRupiah } from "@/lib/format";
import { OrderActions } from "@/components/order/order-actions";
export default async function Orders() {
  const user = await requireCurrentUser("/orders");
  const { purchases, sales } = await getOrders(user.id);
  return (
    <Shell>
      <section className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
          AKTIVITAS
        </p>
        <h1 className="mb-8 mt-1 text-3xl font-bold text-[#26332d]">Pesanan</h1>
        <div className="grid gap-8 md:grid-cols-2">
          {[
            ["Pembelian", purchases],
            ["Penjualan", sales],
          ].map(([title, list]) => (
            <div key={title as string}>
              <h2 className="mb-4 text-xl font-bold text-[#26332d]">
                {title as string}
              </h2>
              <div className="grid gap-3">
                {!(list as Awaited<ReturnType<typeof getOrders>>["purchases"])
                  .length && (
                  <div className="rounded-2xl border border-dashed border-[#d6d0c3] bg-[#fffefa] p-6 text-sm text-stone-600">
                    {title === "Pembelian"
                      ? "Kamu belum memiliki pesanan pembelian."
                      : "Belum ada pesanan masuk dari pembeli."}
                  </div>
                )}
                {(
                  list as Awaited<ReturnType<typeof getOrders>>["purchases"]
                ).map((o) => (
                  <article
                    key={o.id}
                    id={o.id}
                    className="rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-4 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <p className="font-semibold">{o.productTitleSnapshot}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-2 text-sm text-stone-500">
                      {o.orderCode} · {formatRupiah(o.priceAtOrder)}
                    </p>
                    <p className="mt-3 text-sm">Penerima: {o.shippingName}</p>
                    {o.shippingPhone && (
                      <p className="text-sm">Telepon: {o.shippingPhone}</p>
                    )}
                    {o.shippingAddress ? (
                      <p className="text-sm">Alamat: {o.shippingAddress}</p>
                    ) : (
                      title === "Penjualan" && (
                        <p className="text-xs text-stone-500">
                          Tersedia setelah pesanan dikonfirmasi
                        </p>
                      )
                    )}
                    {title === "Pembelian" &&
                      (o.paymentInstruction ? (
                        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
                          Pembayaran: {o.paymentInstruction.providerName} ·{" "}
                          {o.paymentInstruction.accountHolderName} ·{" "}
                          {o.paymentInstruction.accountNumber}
                        </p>
                      ) : (
                        (o.status === "confirmed" ||
                          o.status === "completed") && (
                          <p className="mt-3 rounded-lg bg-stone-100 p-3 text-sm text-stone-700">
                            Kontak penjual untuk detail pembayaran.
                          </p>
                        )
                      ))}
                    <OrderActions
                      orderId={o.id}
                      status={o.status}
                      role={title === "Penjualan" ? "seller" : "buyer"}
                    />
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
