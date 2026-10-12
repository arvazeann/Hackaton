import { Navbar } from "./navbar";
import { getCurrentUser } from "@/lib/session";
export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  return (
    <>
      <Navbar userName={session?.name ?? null} />
      <main className="min-h-[80vh]">{children}</main>
      <footer className="mt-20 border-t bg-stone-50">
        <div className="mx-auto flex max-w-7xl justify-between px-4 py-8 text-sm text-stone-500">
          <span>© 2026 RuangLagi</span>
          <span>Barang baik, cerita baru.</span>
        </div>
      </footer>
    </>
  );
}
