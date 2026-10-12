import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { getProduct } from "@/server/services/products";
import { requireCurrentUser } from "@/lib/session";
import { OrderForm } from "@/components/forms/order-form";
export default async function Order({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser(`/products/${id}/order`);
  const p = await getProduct(id, user.id);
  if (!p || p.status !== "active" || p.seller.id === user.id) notFound();
  return (
    <Shell>
      <section className="mx-auto max-w-xl px-4 py-12">
        <p className="mb-6 text-sm text-stone-500">Pesanan untuk {p.title}</p>
        <OrderForm productId={id} />
      </section>
    </Shell>
  );
}
