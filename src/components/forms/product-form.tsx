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
    <form className="grid gap-5" onSubmit={handleSubmit(save)}>
      <h1 className="text-3xl font-bold">
        {product ? "Edit produk" : "Jual barang preloved"}
      </h1>
      <label className="grid gap-2 text-sm font-medium">
        Nama barang
        <input
          {...register("title")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.title?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Deskripsi
        <textarea
          rows={5}
          {...register("description")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.description?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Harga (Rupiah)
        <input
          type="number"
          {...register("price", { valueAsNumber: true })}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.price?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Kategori
        <select
          {...register("categoryId")}
          className="rounded-xl border px-4 py-3 font-normal"
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
          className="rounded-xl border px-4 py-3 font-normal"
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
          className="rounded-xl border px-4 py-3 font-normal"
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
        className="rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white"
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
          className="rounded-full border border-rose-300 px-6 py-3 font-semibold text-rose-700"
        >
          Arsipkan produk
        </button>
      )}
    </form>
  );
}
