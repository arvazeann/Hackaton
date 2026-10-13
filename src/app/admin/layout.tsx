import Link from "next/link";
import { requireAdminPage } from "@/server/admin/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage("/admin");
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
          <Link className="mr-auto font-black text-emerald-900" href="/admin">
            RuangLagi · Admin
          </Link>
          <nav
            aria-label="Navigasi admin"
            className="flex flex-wrap gap-3 text-sm"
          >
            <Link href="/admin/users">Pengguna</Link>
            <Link href="/admin/products">Produk</Link>
            <Link href="/admin/orders">Pesanan</Link>
            <Link href="/admin/addresses">Alamat</Link>
            <Link href="/">Kembali ke toko</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
