"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { productSchema } from "@/schemas";
import type { ProductDetail } from "@/types";
import type { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import {
  ImageUploader,
  type UploadImage,
} from "@/components/forms/image-uploader";
import { requestApi } from "@/components/forms/request-api";
type Values = z.infer<typeof productSchema>;
type Category = { id: string; name: string; slug: string };
export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductDetail;
}) {
  const router = useRouter();
  const [uploadingImages, setUploadingImages] = useState(false);
  const initialImages: UploadImage[] =
    product?.images.map((image) => ({
      id: image.id,
      storageKey: image.storageKey ?? image.url,
      position: image.position,
      url: image.url,
      status: "ready",
    })) ?? [];
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          title: product.title,
          description: product.description,
          price: product.price,
          categoryId: product.category.id,
          condition: product.condition,
          city: product.city,
          images: initialImages.map(({ storageKey, position }) => ({
            storageKey,
            position,
          })),
        }
      : {
          title: "",
          description: "",
          price: undefined,
          categoryId: "",
          condition: "good",
          city: "",
          images: [],
        },
  });
  const productTitle = useWatch({ control, name: "title" });
  async function save(values: Values) {
    const result = product
      ? await requestApi<ProductDetail>(
          `/api/products/${encodeURIComponent(product.id)}`,
          "PATCH",
          values,
        )
      : await requestApi<ProductDetail>("/api/products", "POST", values);
    if (result.success) {
      router.push("/dashboard/products");
      router.refresh();
    } else
      for (const [name, messages] of Object.entries(
        result.error.fieldErrors ?? {},
      ))
        setError(name as keyof Values, { message: messages?.[0] });
  }
  async function archive() {
    if (!product) return;
    const result = await requestApi(
      `/api/products/${encodeURIComponent(product.id)}`,
      "DELETE",
    );
    if (result.success) {
      router.push("/dashboard/products");
      router.refresh();
    }
  }
  return (
    <form
      className="grid gap-5 rounded-3xl border border-[#e3ded2] bg-[#fffefa] p-5 shadow-[0_12px_34px_rgba(39,52,44,0.06)] sm:gap-6 sm:p-8"
      onSubmit={handleSubmit(save)}
    >
      <h1 className="text-3xl font-bold text-[#26332d]">
        {product ? "Edit produk" : "Jual barang preloved"}
      </h1>
      <label className="grid gap-2 text-sm font-medium">
        Nama barang
        <input
          {...register("title")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal outline-none focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.title?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Deskripsi
        <textarea
          rows={5}
          {...register("description")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal outline-none focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.description?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Harga (Rupiah)
        <input
          type="number"
          {...register("price", { valueAsNumber: true })}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal outline-none focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.price?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Kategori
        <select
          {...register("categoryId")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal outline-none focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        >
          <option value="">Pilih kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.categoryId?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Kondisi
        <select
          {...register("condition")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal outline-none focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        >
          <option value="like_new">Seperti baru</option>
          <option value="good">Baik</option>
          <option value="fair">Cukup</option>
        </select>
        <FieldError message={errors.condition?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Kota
        <input
          {...register("city")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal outline-none focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.city?.message} />
      </label>
      <div className="grid gap-2 text-sm font-medium">
        Foto barang
        <ImageUploader
          initialImages={initialImages}
          altPrefix={productTitle || "Foto produk"}
          onChange={(value) =>
            setValue("images", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onUploadingChange={setUploadingImages}
          error={errors.images?.message}
        />
      </div>
      <button
        disabled={isSubmitting || uploadingImages}
        className="min-h-12 rounded-full bg-[#174c3c] px-6 py-3 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting
          ? "Menyimpan…"
          : product
            ? "Simpan perubahan"
            : "Terbitkan barang"}
      </button>
      {product && (
        <button
          type="button"
          onClick={archive}
          className="min-h-12 rounded-full border border-rose-300 px-6 py-3 font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Arsipkan produk
        </button>
      )}
    </form>
  );
}
