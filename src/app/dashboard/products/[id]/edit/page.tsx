import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { getProduct } from "@/server/services/products";
import { requireCurrentUser } from "@/lib/session";
import { ProductForm } from "@/components/forms/product-form";
import { getProductCategories } from "@/server/services/products";
export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser(`/dashboard/products/${id}/edit`);
  const p = await getProduct(id, user.id);
  if (!p || p.seller.id !== user.id) notFound();
  if (p.status !== "active")
    return (
      <Shell>
        <section className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h1 className="text-3xl text-foreground">
              Produk tidak dapat diedit
            </h1>
            <p className="mt-3 text-muted-foreground">
              Produk dengan status {p.status} tidak bisa diubah.
            </p>
          </div>
        </section>
      </Shell>
    );
  return (
    <Shell>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <ProductForm categories={await getProductCategories()} product={p} />
      </section>
    </Shell>
  );
}
