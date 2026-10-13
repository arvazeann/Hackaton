import { AdminPagination } from "@/components/admin/admin-pagination";
import { adminAuditLogQuerySchema } from "@/schemas";
import { listAdminAuditLogs } from "@/server/services/admin";

export default async function AdminAuditLogsPage({
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
  const query = adminAuditLogQuerySchema.safeParse(flat);
  if (!query.success)
    return (
      <p role="alert" className="rounded-xl border bg-white p-5">
        Filter atau halaman tidak valid. Atur ulang filter.
      </p>
    );
  const result = await listAdminAuditLogs(query.data);
  return (
    <section>
      <h1 className="text-3xl font-black">Audit log</h1>
      <p className="mt-2 text-sm text-stone-600">
        Metadata dibatasi ke aksi dan perubahan status. Data kontak, pembayaran,
        nilai pribadi, dan alasan pembatalan tidak ditampilkan.
      </p>
      <form
        className="mt-5 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3"
        method="get"
      >
        <label className="text-sm">
          Aksi
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="action"
            defaultValue={query.data.action ?? ""}
          />
        </label>
        <label className="text-sm">
          Tipe target
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="targetType"
            defaultValue={query.data.targetType ?? ""}
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="rounded-lg bg-emerald-800 px-4 py-2 text-white"
            type="submit"
          >
            Terapkan
          </button>
          <a className="rounded-lg border px-4 py-2" href="/admin/audit-logs">
            Atur ulang
          </a>
        </div>
      </form>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-stone-100">
            <tr>
              {[
                "Waktu",
                "Admin",
                "Aksi",
                "Target",
                "Metadata",
                "Request ID",
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
                <td className="px-4 py-3">
                  <time dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString("id-ID")}
                  </time>
                </td>
                <td className="px-4 py-3">
                  {item.actor?.name ?? "Admin tidak tersedia"}
                </td>
                <td className="px-4 py-3">{item.action}</td>
                <td className="px-4 py-3">
                  {item.targetType} · {item.targetId}
                </td>
                <td className="px-4 py-3">
                  {item.metadata ? JSON.stringify(item.metadata) : "—"}
                </td>
                <td className="px-4 py-3">{item.requestId ?? "—"}</td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-stone-500"
                  colSpan={6}
                >
                  Belum ada audit untuk filter ini.
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
