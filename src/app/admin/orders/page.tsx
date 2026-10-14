import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminOrderCancelAction } from "@/components/admin/admin-mutation-actions";
import { adminOrderQuerySchema } from "@/schemas";
import { listAdminOrders } from "@/server/services/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const query = adminOrderQuerySchema.safeParse(flat);
  if (!query.success)
    return (
      <p role="alert" className="rounded-xl border bg-card p-5">
        Filter atau halaman tidak valid. Atur ulang filter.
      </p>
    );
  const result = await listAdminOrders(query.data);
  return (
    <section>
      <h1 className="text-3xl">Pesanan</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Data kontak, alamat, dan pembayaran order tidak ditampilkan.
      </p>
      <form
        className="mt-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3"
        method="get"
      >
        <label className="text-sm">
          Kode pesanan
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="q"
            defaultValue={query.data.q ?? ""}
          />
        </label>
        <label className="text-sm">
          Status
          <Select name="status" defaultValue={query.data.status ?? ""}>
            <SelectTrigger
              aria-label="Status pesanan"
              className="mt-1 w-full min-w-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua</SelectItem>
              {[
                "pending",
                "confirmed",
                "completed",
                "cancelled",
                "rejected",
              ].map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm">
          ID pembeli/penjual
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="identityId"
            defaultValue={query.data.identityId ?? ""}
          />
        </label>
        <div className="flex gap-2 sm:col-span-3">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            type="submit"
          >
            Terapkan
          </button>
          <a className="rounded-lg border px-4 py-2" href="/admin/orders">
            Atur ulang
          </a>
        </div>
      </form>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {[
                "Kode",
                "Produk",
                "Harga",
                "Status",
                "Pembeli",
                "Penjual",
                "Dibuat",
                "Tindakan",
              ].map((heading) => (
                <th className="px-4 py-3 font-semibold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.orderCode}</td>
                <td className="px-4 py-3">{item.productTitle}</td>
                <td className="px-4 py-3">
                  Rp{item.price.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">{item.buyer.name}</td>
                <td className="px-4 py-3">{item.seller.name}</td>
                <td className="px-4 py-3">
                  {new Date(item.createdAt).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3">
                  {item.status === "pending" ? (
                    <AdminOrderCancelAction orderId={item.id} />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={8}
                >
                  Tidak ada pesanan untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AdminPagination
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        query={flat}
      />
    </section>
  );
}
