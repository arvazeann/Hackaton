import Link from "next/link";
import { getAdminOverview } from "@/server/services/admin";

const number = new Intl.NumberFormat("id-ID");

export default async function AdminDashboard() {
  const overview = await getAdminOverview();
  const metrics = [
    ["Total pengguna", overview.users.total],
    ["Daftar · 7 hari", overview.users.registeredLast7Days],
    ["Daftar · 30 hari", overview.users.registeredLast30Days],
    ["Online · perkiraan 15 menit", overview.users.onlineApproximate],
    ["Aktif · 7 hari", overview.users.activeLast7Days],
  ] as const;
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-emerald-800">ADMIN AREA</p>
        <h1 className="mt-1 text-3xl font-black">Ringkasan marketplace</h1>
        <p className="mt-2 text-sm text-stone-600">
          Tampilan baca-saja. Angka online memperkirakan aktivitas dalam 15
          menit terakhir.
        </p>
      </div>
      <section
        aria-label="Ringkasan pengguna"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {metrics.map(([label, value]) => (
          <article key={label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{number.format(value)}</p>
          </article>
        ))}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-bold">Produk berdasarkan status</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(overview.productsByStatus).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="flex justify-between rounded-lg bg-stone-50 p-3"
                >
                  <dt>{status}</dt>
                  <dd className="font-semibold">{number.format(count)}</dd>
                </div>
              ),
            )}
          </dl>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-emerald-800"
            href="/admin/products"
          >
            Lihat produk →
          </Link>
        </section>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-bold">Pesanan berdasarkan status</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(overview.ordersByStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex justify-between rounded-lg bg-stone-50 p-3"
              >
                <dt>{status}</dt>
                <dd className="font-semibold">{number.format(count)}</dd>
              </div>
            ))}
          </dl>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-emerald-800"
            href="/admin/orders"
          >
            Lihat pesanan →
          </Link>
        </section>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-bold">Pendaftaran terbaru</h2>
          {overview.latestUsers.length ? (
            <ul className="mt-3 divide-y">
              {overview.latestUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    {user.name} · {user.emailMasked}
                  </span>
                  <time dateTime={user.createdAt}>
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Belum ada pengguna.</p>
          )}
          <Link
            className="mt-3 inline-block text-sm font-semibold text-emerald-800"
            href="/admin/users"
          >
            Lihat pengguna →
          </Link>
        </section>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-bold">Pesanan terbaru</h2>
          {overview.latestOrders.length ? (
            <ul className="mt-3 divide-y">
              {overview.latestOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    {order.orderCode} · {order.productTitle} · {order.status}
                  </span>
                  <time dateTime={order.createdAt}>
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Belum ada pesanan.</p>
          )}
          <Link
            className="mt-3 inline-block text-sm font-semibold text-emerald-800"
            href="/admin/orders"
          >
            Lihat pesanan →
          </Link>
        </section>
      </div>
    </div>
  );
}
