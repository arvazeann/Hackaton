import { Shell } from "@/components/layout/shell";
import { requireCurrentUser } from "@/lib/session";
import { ProductForm } from "@/components/forms/product-form";
import { getProductCategories } from "@/server/services/products";
export default async function NewProduct() {
  await requireCurrentUser("/dashboard/products/new");
  const categories = await getProductCategories();
  return (
    <Shell>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <ProductForm categories={categories} />
      </section>
    </Shell>
  );
}
