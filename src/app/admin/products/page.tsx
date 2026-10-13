import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminProductQuerySchema } from "@/schemas";
import { listAdminProducts } from "@/server/services/admin";

export default async function AdminProductsPage({
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
  const query = adminProductQuerySchema.safeParse(flat);
  if (!query.success)
    return (
      <p role="alert" className="rounded-xl border bg-white p-5">
        Filter atau halaman tidak valid. Atur ulang filter.
      </p>
    );
  const result = await listAdminProducts(query.data);
  return (
    <section>
      <h1 className="text-3xl font-black">Produk</h1>
      <p className="mt-2 text-sm text-stone-600">
        Informasi baca-saja; tidak ada tindakan perubahan status.
      </p>
      <form
        className="mt-5 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3"
        method="get"
      >
        <label className="text-sm">
          Judul
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="q"
            defaultValue={query.data.q ?? ""}
          />
        </label>
        <label className="text-sm">
          Status
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="status"
            defaultValue={query.data.status ?? ""}
          >
            <option value="">Semua</option>
            {["active", "reserved", "sold", "archived"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Slug kategori
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="category"
            defaultValue={query.data.category ?? ""}
          />
        </label>
        <div className="flex gap-2 sm:col-span-3">
          <button
            className="rounded-lg bg-emerald-800 px-4 py-2 text-white"
            type="submit"
          >
            Terapkan
          </button>
          <a className="rounded-lg border px-4 py-2" href="/admin/products">
            Atur ulang
          </a>
        </div>
      </form>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-stone-100">
            <tr>
              {[
                "Produk",
                "Harga",
                "Status",
                "Kategori",
                "Penjual",
                "Dibuat",
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
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">
                  Rp{item.price.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">{item.seller.name}</td>
                <td className="px-4 py-3">
                  {new Date(item.createdAt).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-stone-500"
                  colSpan={6}
                >
                  Tidak ada produk untuk filter ini.
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
