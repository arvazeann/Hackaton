import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Heart,
  Plus,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { logout } from "@/server/actions/auth";
import { getUnreadNotificationCount } from "@/server/services/notifications";

export async function Navbar({
  userName,
  userId,
  isAdmin,
}: {
  userName: string | null;
  userId: string | null;
  isAdmin: boolean;
}) {
  const unreadCount = userId ? await getUnreadNotificationCount(userId) : 0;
  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-emerald-800"
        >
          ruanglagi<span className="text-orange-500">.</span>
        </Link>
        <form action="/products" className="hidden flex-1 md:block">
          <div className="flex rounded-full border bg-stone-50 px-4">
            <Search className="my-auto size-4 text-stone-400" />
            <input
              aria-label="Cari barang"
              name="q"
              placeholder="Cari barang preloved..."
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </form>
        <nav className="ml-auto flex items-center gap-3 text-sm font-medium">
          <Link
            className="hidden items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-white sm:flex"
            href="/dashboard/products/new"
          >
            <Plus size={16} /> Jual
          </Link>
          <Link aria-label="Wishlist" href="/wishlist" className="p-2">
            <Heart size={19} />
          </Link>
          {userId && (
            <Link
              aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
              href="/notifications"
              className="relative p-2"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-orange-500 px-1 text-center text-[10px] leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <Link aria-label="Pesanan" href="/orders" className="p-2">
            <ShoppingBag size={19} />
          </Link>
          {isAdmin && (
            <Link
              aria-label="Admin Area"
              href="/admin"
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5"
            >
              <ShieldCheck size={16} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {userName ? (
            <>
              <Link
                href="/profile"
                className="hidden max-w-32 truncate sm:block"
              >
                {userName}
              </Link>
              <form action={logout}>
                <button
                  className="rounded-full border px-3 py-1.5"
                  type="submit"
                >
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded-full border px-3 py-1.5">
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
