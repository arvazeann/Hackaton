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
      <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
        <p className="text-xs font-bold tracking-[.14em] text-primary">
          AKTIVITAS
        </p>
        <h1 className="mb-8 mt-1 font-serif text-3xl text-foreground lg:text-4xl">
          Pesanan
        </h1>
        <div className="grid gap-8 md:grid-cols-2">
          {[
            ["Pembelian", purchases],
            ["Penjualan", sales],
          ].map(([title, list]) => (
            <div key={title as string}>
              <h2 className="mb-4 text-xl text-foreground">
                {title as string}
              </h2>
              <div className="grid gap-3">
                {!(list as Awaited<ReturnType<typeof getOrders>>["purchases"])
                  .length && (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
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
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <p className="font-semibold">{o.productTitleSnapshot}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
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
                        <p className="text-xs text-muted-foreground">
                          Tersedia setelah pesanan dikonfirmasi
                        </p>
                      )
                    )}
                    {title === "Pembelian" &&
                      (o.paymentInstruction ? (
                        <p className="mt-3 rounded-lg bg-sage-surface p-3 text-sm">
                          Pembayaran: {o.paymentInstruction.providerName} ·{" "}
                          {o.paymentInstruction.accountHolderName} ·{" "}
                          {o.paymentInstruction.accountNumber}
                        </p>
                      ) : (
                        (o.status === "confirmed" ||
                          o.status === "completed") && (
                          <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-foreground">
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
