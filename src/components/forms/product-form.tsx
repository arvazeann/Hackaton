"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { productSchema } from "@/schemas";
import type { ProductDetail } from "@/types";
import type { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import {
  ImageUploader,
  type UploadImage,
} from "@/components/forms/image-uploader";
import { requestApi } from "@/components/forms/request-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      className="grid gap-5 rounded-3xl border border-border bg-card p-5 shadow-card sm:gap-6 sm:p-8"
      onSubmit={handleSubmit(save)}
    >
      <h1 className="text-3xl text-foreground">
        {product ? "Edit produk" : "Jual barang kos preloved"}
      </h1>
      <label className="grid gap-2 text-sm font-medium">
        Nama barang
        <input
          {...register("title")}
          className="rounded-xl border border-border bg-card px-4 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <FieldError message={errors.title?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Deskripsi
        <textarea
          rows={5}
          {...register("description")}
          className="rounded-xl border border-border bg-card px-4 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <FieldError message={errors.description?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Harga (Rupiah)
        <input
          type="number"
          {...register("price", { valueAsNumber: true })}
          className="rounded-xl border border-border bg-card px-4 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <FieldError message={errors.price?.message} />
      </label>
      <div className="grid gap-2 text-sm font-medium">
        Kategori
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={field.disabled}
            >
              <SelectTrigger
                ref={field.ref}
                aria-label="Kategori"
                className="min-h-12 w-full min-w-0 justify-start rounded-xl px-4 py-3 font-normal shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Pilih kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.categoryId?.message} />
      </div>
      <div className="grid gap-2 text-sm font-medium">
        Kondisi
        <Controller
          control={control}
          name="condition"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={field.disabled}
            >
              <SelectTrigger
                ref={field.ref}
                aria-label="Kondisi"
                className="min-h-12 w-full min-w-0 justify-start rounded-xl px-4 py-3 font-normal shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="like_new">Seperti baru</SelectItem>
                <SelectItem value="good">Baik</SelectItem>
                <SelectItem value="fair">Cukup</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.condition?.message} />
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Kota
        <input
          {...register("city")}
          className="rounded-xl border border-border bg-card px-4 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        className="min-h-12 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
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
          className="min-h-12 rounded-full border border-status-error-ink px-6 py-3 font-semibold text-status-error-ink transition hover:bg-status-error-bg"
        >
          Arsipkan produk
        </button>
      )}
    </form>
  );
}
