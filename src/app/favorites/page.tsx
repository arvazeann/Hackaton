import { Shell } from "@/components/layout/shell";
import { ProductGrid } from "@/components/product/cards";
import { getFavorites } from "@/server/services/favorites";
import { requireCurrentUser } from "@/lib/session";
export default async function Favorites() {
  const user = await requireCurrentUser("/favorites");
  const items = await getFavorites(user.id);
  return (
    <Shell>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-sm font-semibold text-emerald-700">
          DISIMPAN UNTUK NANTI
        </p>
        <h1 className="mb-7 mt-1 text-3xl font-bold">Favorit saya</h1>
        <ProductGrid
          products={items}
          emptyTitle="Belum ada produk favorit"
          emptyDescription="Simpan produk yang kamu minati dengan tombol hati."
        />
      </section>
    </Shell>
  );
}
