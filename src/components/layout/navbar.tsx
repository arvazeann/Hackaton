import Link from "next/link";
import {
  Search,
  Heart,
  Plus,
  Bell,
  ShieldCheck,
  UserRound,
  ChevronDown,
  Store,
  Package,
  ShoppingBag,
  UserRoundPen,
  LogOut,
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
      <div className="mx-auto flex max-w-[1536px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 md:flex-nowrap md:gap-x-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 rounded-md text-xl font-black tracking-tight text-[#174c3c] focus-visible:outline-offset-4"
        >
          ruanglagi<span className="text-[#a65b3f]">.</span>
        </Link>
        <form
          action="/products"
          role="search"
          className="hidden min-w-40 flex-1 md:block"
        >
          <label className="flex items-center gap-2 rounded-full border border-[#e3ded2] bg-[#f7f5ef] px-4 transition focus-within:border-[#568270] focus-within:ring-2 focus-within:ring-[#568270]/20">
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
        <nav
          aria-label="Navigasi utama"
          className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium sm:gap-2"
        >
          <Link
            className="inline-flex items-center gap-1 rounded-full bg-[#174c3c] px-2.5 py-2 text-white transition hover:bg-[#103d30] sm:gap-1.5 sm:px-4"
            href="/dashboard/products/new"
            aria-label="Jual barang"
          >
            <Plus aria-hidden="true" size={16} />
            <span className="hidden sm:inline">Jual</span>
          </Link>
          {userId && (
            <Link
              aria-label="Wishlist"
              title="Wishlist"
              href="/wishlist"
              className="rounded-full p-2 text-[#42534a] transition hover:bg-[#f0ede5] hover:text-[#174c3c]"
            >
              <Heart aria-hidden="true" size={19} />
            </Link>
          )}
          {userId && (
            <Link
              aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
              title="Notifikasi"
              href="/notifications"
              className="relative rounded-full p-2 text-[#42534a] transition hover:bg-[#f0ede5] hover:text-[#174c3c]"
            >
              <Bell aria-hidden="true" size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#a65b3f] px-1 text-center text-[10px] leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          {isAdmin && (
            <Link
              aria-label="Admin Area"
              title="Admin Area"
              href="/admin"
              className="inline-flex items-center rounded-full border border-[#e3ded2] p-2 text-[#174c3c] transition hover:bg-[#f0ede5]"
            >
              <ShieldCheck aria-hidden="true" size={17} />
            </Link>
          )}
          {userName ? (
            <details className="group relative">
              <summary
                aria-label={`Menu akun ${userName}`}
                className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#e3ded2] px-3 py-2 text-[#342d25] transition hover:border-[#b8c9be] hover:bg-[#f7f5ef] focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
              >
                <UserRound
                  aria-hidden="true"
                  size={17}
                  className="text-[#174c3c]"
                />
                <span className="hidden max-w-28 truncate sm:inline">
                  {userName}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  size={14}
                  className="text-stone-500 transition group-open:rotate-180"
                />
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#e3ded2] bg-white p-2 shadow-[0_14px_36px_rgba(52,45,37,0.16)]">
                <p className="truncate px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Akun RuangLagi
                </p>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#342d25] transition hover:bg-[#f7f5ef] focus-visible:bg-[#f7f5ef]"
                >
                  <UserRoundPen
                    aria-hidden="true"
                    size={17}
                    className="text-[#568270]"
                  />{" "}
                  Profil &amp; pengaturan
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#342d25] transition hover:bg-[#f7f5ef] focus-visible:bg-[#f7f5ef]"
                >
                  <ShoppingBag
                    aria-hidden="true"
                    size={17}
                    className="text-[#568270]"
                  />{" "}
                  Pesanan
                </Link>
                <div className="my-1 border-t border-[#e3ded2]" />
                <Link
                  href="/dashboard/products"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#342d25] transition hover:bg-[#f7f5ef] focus-visible:bg-[#f7f5ef]"
                >
                  <Package
                    aria-hidden="true"
                    size={17}
                    className="text-[#568270]"
                  />{" "}
                  Produk saya
                </Link>
                <Link
                  href="/profile#store"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#342d25] transition hover:bg-[#f7f5ef] focus-visible:bg-[#f7f5ef]"
                >
                  <Store
                    aria-hidden="true"
                    size={17}
                    className="text-[#568270]"
                  />{" "}
                  Kelola toko
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#8a4032] transition hover:bg-[#fbefeb] focus-visible:bg-[#fbefeb]"
                  >
                    <LogOut aria-hidden="true" size={17} /> Keluar
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-[#174c3c] transition hover:bg-[#f0ede5]"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#174c3c] px-4 py-2 text-white transition hover:bg-[#103d30]"
              >
                Daftar
              </Link>
            </>
          )}
        </nav>
        <form
          action="/products"
          role="search"
          className="order-3 w-full md:hidden"
        >
          <label className="flex items-center gap-2 rounded-full border border-[#e3ded2] bg-[#f7f5ef] px-4 focus-within:ring-2 focus-within:ring-[#568270]/40">
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
