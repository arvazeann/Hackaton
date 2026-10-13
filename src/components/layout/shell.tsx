import { Navbar } from "./navbar";
import { getCurrentUser } from "@/lib/session";
export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 text-[#174c3c] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
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
      <footer className="mt-20 border-t border-[#e3ded2] bg-[#f0ede5]">
        <div className="mx-auto flex max-w-[1536px] flex-col gap-2 px-4 py-8 text-sm text-stone-600 sm:flex-row sm:justify-between lg:px-8">
          <span>© 2026 RuangLagi</span>
          <span>Barang baik, cerita baru.</span>
        </div>
      </footer>
    </>
  );
}
