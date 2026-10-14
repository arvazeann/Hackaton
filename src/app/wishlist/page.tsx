import { Shell } from "@/components/layout/shell";
import { ProductGrid } from "@/components/product/cards";
import { requireCurrentUser } from "@/lib/session";
import { getFavorites } from "@/server/services/favorites";

export default async function WishlistPage() {
  const user = await requireCurrentUser("/wishlist");
  const items = await getFavorites(user.id);
  return (
    <Shell>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-xs font-bold tracking-[.14em] text-primary">
          DISIMPAN UNTUK NANTI
        </p>
        <h1 className="mb-7 mt-1 text-3xl text-foreground">Wishlist saya</h1>
        <ProductGrid
          products={items}
          showOrderAction
          viewerId={user.id}
          emptyTitle="Wishlist masih kosong"
          emptyDescription="Simpan produk yang kamu minati dengan tombol hati."
          emptyAction={{ href: "/products", label: "Jelajahi produk" }}
        />
      </section>
    </Shell>
  );
}
