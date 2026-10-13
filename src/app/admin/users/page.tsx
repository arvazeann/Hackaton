import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminRevealEmailButton } from "@/components/admin/admin-reveal-email-button";
import { adminUserQuerySchema } from "@/schemas";
import { listAdminUsers } from "@/server/services/admin";

export default async function AdminUsersPage({
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
  const query = adminUserQuerySchema.safeParse(flat);
  if (!query.success)
    return (
      <p role="alert" className="rounded-xl border bg-white p-5">
        Filter atau halaman tidak valid. Atur ulang filter.
      </p>
    );
  const result = await listAdminUsers(query.data);
  const paginationQuery = Object.fromEntries(
    Object.entries(flat).map(([key, value]) => [
      key,
      typeof value === "string" ? value : undefined,
    ]),
  );
  return (
    <section>
      <h1 className="text-3xl font-black">Pengguna</h1>
      <p className="mt-2 text-sm text-stone-600">
        Email disamarkan. Pembukaan email dicatat di AuditLog.
      </p>
      <form
        className="mt-5 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4"
        method="get"
      >
        <label className="text-sm">
          Nama atau email
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="q"
            defaultValue={query.data.q ?? ""}
          />
        </label>
        <label className="text-sm">
          Role
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="role"
            defaultValue={query.data.role ?? ""}
          >
            <option value="">Semua</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label className="text-sm">
          Daftar sejak
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="dateFrom"
            type="date"
            defaultValue={query.data.dateFrom ?? ""}
          />
        </label>
        <label className="text-sm">
          Sampai tanggal
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            name="dateTo"
            type="date"
            defaultValue={query.data.dateTo ?? ""}
          />
        </label>
        <div className="flex gap-2 sm:col-span-4">
          <button
            className="rounded-lg bg-emerald-800 px-4 py-2 text-white"
            type="submit"
          >
            Terapkan
          </button>
          <a className="rounded-lg border px-4 py-2" href="/admin/users">
            Atur ulang
          </a>
        </div>
      </form>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-100">
            <tr>
              {[
                "Nama",
                "Email",
                "Role",
                "Terdaftar",
                "Login terakhir",
                "Aktivitas terakhir",
              ].map((heading) => (
                <th className="px-4 py-3 font-semibold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.items.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">
                  <AdminRevealEmailButton
                    userId={user.id}
                    maskedEmail={user.emailMasked}
                  />
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <time dateTime={user.createdAt}>
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </time>
                </td>
                <td className="px-4 py-3">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString("id-ID")
                    : "Belum tercatat"}
                </td>
                <td className="px-4 py-3">
                  {user.lastActiveAt ? (
                    <>
                      {new Date(user.lastActiveAt).toLocaleString("id-ID")}{" "}
                      {user.isOnline ? "· Online (perkiraan)" : ""}
                    </>
                  ) : (
                    "Belum tercatat"
                  )}
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-stone-500"
                  colSpan={6}
                >
                  Tidak ada pengguna untuk filter ini.
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
        query={paginationQuery}
      />
    </section>
  );
}
