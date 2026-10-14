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

const iconLinkClass =
  "inline-flex size-11 items-center justify-center rounded-pill text-foreground transition-colors duration-control ease-soft hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus";

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
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full min-w-0 max-w-[1536px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:flex-nowrap md:gap-x-5 lg:px-8">
        <Link
          href="/"
          className="shrink-0 rounded-sm font-serif text-2xl leading-none text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
        >
          ruanglagi<span className="text-accent-bright">.</span>
        </Link>

        <form
          action="/products"
          role="search"
          className="hidden min-w-40 flex-1 md:block"
        >
          <label className="flex min-h-11 items-center gap-2 rounded-pill border border-border bg-card px-4 transition-colors duration-control ease-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-focus/20">
            <Search
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <input
              aria-label="Cari barang"
              name="q"
              placeholder="Cari kebutuhan kos..."
              className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </form>

        <nav
          aria-label="Navigasi utama"
          className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-0.5 text-sm font-medium sm:gap-1"
        >
          <Link
            href="/dashboard/products/new"
            aria-label="Jual barang"
          className="inline-flex min-h-11 items-center gap-1 rounded-pill bg-primary px-3 text-primary-foreground transition-colors duration-control ease-soft hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus sm:gap-1.5 sm:px-4"
          >
            <Plus aria-hidden="true" size={16} />
            <span className="hidden sm:inline">Jual</span>
          </Link>
          {userId && (
            <Link
              aria-label="Wishlist"
              title="Wishlist"
              href="/wishlist"
              className={`${iconLinkClass} hidden sm:inline-flex`}
            >
              <Heart aria-hidden="true" size={19} />
            </Link>
          )}
          {userId && (
            <Link
              aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
              title="Notifikasi"
              href="/notifications"
              className={`relative ${iconLinkClass} hidden sm:inline-flex`}
            >
              <Bell aria-hidden="true" size={19} />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 min-w-5 rounded-pill bg-sage px-1 text-center text-xs leading-5 text-primary">
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
              className={`${iconLinkClass} hidden border border-border text-primary sm:inline-flex`}
            >
              <ShieldCheck aria-hidden="true" size={18} />
            </Link>
          )}
          {userName ? (
            <details className="group relative">
              <summary
                aria-label={`Menu akun ${userName}`}
                className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-pill border border-border bg-card px-3 text-foreground transition-colors duration-control ease-soft hover:border-primary/40 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden"
              >
                <UserRound
                  aria-hidden="true"
                  size={17}
                  className="text-primary"
                />
                <span className="hidden max-w-28 truncate sm:inline">
                  {userName}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  size={14}
                  className="text-muted-foreground transition group-open:rotate-180"
                />
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-card border border-border bg-card p-2 shadow-menu">
                <p className="truncate px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Akun RuangLagi
                </p>
                <Link
                  href="/profile"
                  className="flex min-h-11 items-center gap-3 rounded-image px-3 py-2 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <UserRoundPen
                    aria-hidden="true"
                    size={17}
                    className="text-primary"
                  />{" "}
                  Profil &amp; pengaturan
                </Link>
                <Link
                  href="/orders"
                  className="flex min-h-11 items-center gap-3 rounded-image px-3 py-2 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <ShoppingBag
                    aria-hidden="true"
                    size={17}
                    className="text-primary"
                  />{" "}
                  Pesanan
                </Link>
                <Link
                  href="/wishlist"
                  className="flex min-h-11 items-center gap-3 rounded-image px-3 py-2 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:hidden"
                >
                  <Heart
                    aria-hidden="true"
                    size={17}
                    className="text-primary"
                  />{" "}
                  Wishlist
                </Link>
                <Link
                  href="/notifications"
                  className="flex min-h-11 items-center gap-3 rounded-image px-3 py-2 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:hidden"
                >
                  <Bell aria-hidden="true" size={17} className="text-primary" />{" "}
                  Notifikasi
                  {unreadCount > 0
                    ? ` (${unreadCount > 99 ? "99+" : unreadCount})`
                    : ""}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex min-h-11 items-center gap-3 rounded-image px-3 py-2 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:hidden"
                  >
                    <ShieldCheck
                      aria-hidden="true"
                      size={17}
                      className="text-primary"
                    />{" "}
                    Admin Area
                  </Link>
                )}
                <div className="my-1 border-t border-border" />
                <Link
                  href="/dashboard/products"
                  className="flex min-h-11 items-center gap-3 rounded-image px-3 py-2 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <Package
                    aria-hidden="true"
                    size={17}
                    className="text-primary"
                  />{" "}
                  Produk saya
                </Link>
                <Link
                  href="/profile#store"
                  className="flex min-h-11 items-center gap-3 rounded-image px-3 py-2 text-sm text-foreground transition-colors duration-control ease-soft hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <Store
                    aria-hidden="true"
                    size={17}
                    className="text-primary"
                  />{" "}
                  Kelola toko
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-3 rounded-image px-3 py-2 text-left text-sm text-orange-ink transition-colors duration-control ease-soft hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
                className="inline-flex min-h-11 items-center rounded-pill px-3 text-primary transition-colors duration-control ease-soft hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center rounded-pill bg-primary px-4 text-primary-foreground transition-colors duration-control ease-soft hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
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
          <label className="flex min-h-11 items-center gap-2 rounded-pill border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-focus/30">
            <Search
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <input
              aria-label="Cari barang"
              name="q"
              placeholder="Cari kebutuhan kos..."
              className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </form>
      </div>
    </header>
  );
}
