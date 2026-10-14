import Link from "next/link";
import { Navbar } from "./navbar";
import { getCurrentUser } from "@/lib/session";

const footerLinkClass =
  "inline-flex min-h-11 items-center text-primary-foreground/80 transition-colors duration-control ease-soft hover:text-primary-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus";

export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-card px-4 py-2 text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Lewati ke konten
      </a>
      <Navbar
        userName={session?.name ?? null}
        userId={session?.id ?? null}
        isAdmin={session?.platformRole === "ADMIN"}
      />
      <main id="main-content" className="min-h-[80vh]">
        {children}
      </main>
      <footer className="mt-16 overflow-hidden rounded-t-card bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-[1536px] gap-10 px-5 pb-10 pt-12 sm:grid-cols-[1.2fr_2fr] sm:px-8 lg:grid-cols-[1.4fr_2fr] lg:px-12 lg:pt-16">
          <div className="max-w-sm">
            <Link
              href="/"
              className="rounded-lg font-serif text-3xl lowercase tracking-tight text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus"
            >
              ruanglagi
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-primary-foreground/80">
              Furnitur kecil, alat dapur, perlengkapan tidur, dan kebutuhan kos
              lainnya—preloved, terjangkau, siap menemani hari-hari di kos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="grid content-start gap-3">
              <h2>Jelajahi</h2>
              <Link className={footerLinkClass} href="/products">
                Semua barang
              </Link>
              {session && (
                <Link className={footerLinkClass} href="/wishlist">
                  Wishlist
                </Link>
              )}
            </div>
            <div className="grid content-start gap-3">
              <h2>Akun</h2>
              {session ? (
                <>
                  <Link className={footerLinkClass} href="/profile">
                    Profil
                  </Link>
                  <Link className={footerLinkClass} href="/orders">
                    Pesanan
                  </Link>
                  <Link className={footerLinkClass} href="/notifications">
                    Notifikasi
                  </Link>
                </>
              ) : (
                <>
                  <Link className={footerLinkClass} href="/login">
                    Masuk
                  </Link>
                  <Link className={footerLinkClass} href="/register">
                    Daftar
                  </Link>
                </>
              )}
            </div>
            <div className="grid content-start gap-3">
              <h2>Jual barang</h2>
              <Link className={footerLinkClass} href="/dashboard/products/new">
                Mulai menjual
              </Link>
              {session && (
                <Link className={footerLinkClass} href="/dashboard/products">
                  Produk saya
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1536px] flex-col items-start gap-2 border-t border-primary-foreground/20 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-12">
          <span
            aria-hidden="true"
            className="font-serif text-5xl lowercase leading-none tracking-tight text-primary-foreground/10 sm:text-7xl"
          >
            ruanglagi
          </span>
          <small className="text-primary-foreground/75">
            © 2026 ruanglagi. Barang baik, cerita baru.
          </small>
        </div>
      </footer>
    </>
  );
}
