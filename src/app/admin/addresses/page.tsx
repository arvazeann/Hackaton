import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminAddressQuerySchema } from "@/schemas";
import { listAdminAddresses } from "@/server/services/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function AdminAddressesPage({
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
  const query = adminAddressQuerySchema.safeParse(flat);
  if (!query.success)
    return (
      <p role="alert" className="rounded-xl border bg-card p-5">
        Filter atau halaman tidak valid. Atur ulang filter.
      </p>
    );
  const result = await listAdminAddresses(query.data);
  return (
    <section>
      <h1 className="text-3xl">Alamat</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ringkasan saja. Nama kontak, telepon, jalan, dan kode pos tetap
        disamarkan/tidak ditampilkan.
      </p>
      <form
        className="mt-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4"
        method="get"
      >
        <label className="text-sm">
          Pemilik
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="q"
            defaultValue={query.data.q ?? ""}
          />
        </label>
        <label className="text-sm">
          Jenis
          <Select name="kind" defaultValue={query.data.kind ?? ""}>
            <SelectTrigger
              aria-label="Jenis alamat"
              className="mt-1 w-full min-w-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua</SelectItem>
              <SelectItem value="SHIPPING">Pengiriman</SelectItem>
              <SelectItem value="PICKUP">Ambil di tempat</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm">
          Kota
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="city"
            defaultValue={query.data.city ?? ""}
          />
        </label>
        <label className="text-sm">
          Provinsi
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="province"
            defaultValue={query.data.province ?? ""}
          />
        </label>
        <div className="flex gap-2 sm:col-span-4">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            type="submit"
          >
            Terapkan
          </button>
          <a className="rounded-lg border px-4 py-2" href="/admin/addresses">
            Atur ulang
          </a>
        </div>
      </form>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {[
                "Pemilik",
                "Jenis",
                "Label",
                "Kota",
                "Provinsi",
                "Default",
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
                <td className="px-4 py-3">{item.owner.name}</td>
                <td className="px-4 py-3">{item.kind}</td>
                <td className="px-4 py-3">{item.label}</td>
                <td className="px-4 py-3">{item.city}</td>
                <td className="px-4 py-3">{item.province}</td>
                <td className="px-4 py-3">{item.isDefault ? "Ya" : "Tidak"}</td>
                <td className="px-4 py-3">
                  {new Date(item.createdAt).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  Tidak ada alamat untuk filter ini.
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
