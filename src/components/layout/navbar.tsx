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
    <header className="sticky top-0 z-30 border-b border-[#e3ded2] bg-[#fffefa]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="rounded-md text-xl font-black tracking-tight text-[#174c3c] focus-visible:outline-offset-4"
        >
          ruanglagi<span className="text-orange-500">.</span>
        </Link>
        <form
          action="/products"
          role="search"
          className="hidden min-w-40 flex-1 md:block"
        >
          <div className="flex rounded-full border border-[#e3ded2] bg-[#f6f3ec] px-4 focus-within:ring-2 focus-within:ring-[#568270]/40">
            <Search className="my-auto size-4 text-stone-400" />
            <input
              aria-label="Cari barang"
              name="q"
              placeholder="Cari barang preloved..."
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-stone-500"
            />
          </div>
        </form>
        <nav
          aria-label="Navigasi utama"
          className="ml-auto flex items-center gap-1 text-sm font-medium sm:gap-2"
        >
          <Link
            className="inline-flex items-center gap-1 rounded-full bg-[#174c3c] px-2.5 py-2 text-white transition hover:bg-[#103d30] sm:gap-1.5 sm:px-4"
            href="/dashboard/products/new"
          >
            <Plus aria-hidden="true" size={16} />
            <span className="hidden sm:inline">Jual</span>
          </Link>
          <Link
            aria-label="Wishlist"
            href="/wishlist"
            className="rounded-full p-2 text-[#42534a] transition hover:bg-[#f0ede5] hover:text-[#174c3c]"
          >
            <Heart size={19} />
          </Link>
          {userId && (
            <Link
              aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
              href="/notifications"
              className="relative rounded-full p-2 text-[#42534a] transition hover:bg-[#f0ede5] hover:text-[#174c3c]"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-orange-500 px-1 text-center text-[10px] leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <Link
            aria-label="Pesanan"
            href="/orders"
            className="rounded-full p-2 text-[#42534a] transition hover:bg-[#f0ede5] hover:text-[#174c3c]"
          >
            <ShoppingBag size={19} />
          </Link>
          {isAdmin && (
            <Link
              aria-label="Admin Area"
              href="/admin"
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[#174c3c] transition hover:bg-[#f0ede5]"
            >
              <ShieldCheck size={16} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {userName ? (
            <>
              <Link
                href="/profile"
                className="hidden max-w-32 truncate rounded-full px-2 py-1 text-[#174c3c] hover:bg-[#f0ede5] sm:block"
              >
                {userName}
              </Link>
              <form action={logout}>
                <button
                  className="rounded-full border px-3 py-1.5 transition hover:bg-[#f0ede5]"
                  type="submit"
                >
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border px-3 py-1.5 transition hover:bg-[#f0ede5]"
            >
              Masuk
            </Link>
          )}
        </nav>
        <form
          action="/products"
          role="search"
          className="order-3 w-full md:hidden"
        >
          <label className="flex items-center gap-2 rounded-full border border-[#e3ded2] bg-[#f6f3ec] px-4 focus-within:ring-2 focus-within:ring-[#568270]/40">
            <Search
              aria-hidden="true"
              className="size-4 shrink-0 text-stone-500"
            />
            <input
              aria-label="Cari barang"
              name="q"
              placeholder="Cari barang preloved..."
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-stone-500"
            />
          </label>
        </form>
      </div>
    </header>
  );
}
