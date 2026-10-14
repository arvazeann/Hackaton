"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { orderSchema } from "@/schemas";
import type { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import { requestApi } from "@/components/forms/request-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderDTO } from "@/types";
type Values = z.infer<typeof orderSchema>;
type SavedAddress = {
  id: string;
  label: string;
  contactName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  kind: string;
};
export function OrderForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      shippingName: "",
      shippingPhone: "",
      shippingAddress: "",
      note: "",
    },
  });
  useEffect(() => {
    void fetch("/api/profile/hub")
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        setAddresses(
          (result.data?.addresses ?? []).filter(
            (address: SavedAddress) => address.kind === "SHIPPING",
          ),
        );
      })
      .catch(() => undefined);
  }, []);
  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        const result = await requestApi<OrderDTO>("/api/orders", "POST", {
          ...values,
          productId,
        });
        if (result.success) {
          router.push("/orders");
          router.refresh();
        } else
          for (const [name, messages] of Object.entries(
            result.error.fieldErrors ?? {},
          ))
            setError(name as keyof Values, { message: messages?.[0] });
      })}
    >
      <h1 className="text-3xl">Detail pengiriman</h1>
      {addresses.length > 0 && (
        <label className="grid gap-2 text-sm font-medium">
          Gunakan alamat tersimpan
          <Select
            value={selectedAddressId}
            onValueChange={(addressId) => {
              setSelectedAddressId(addressId);
              const selected = addresses.find(({ id }) => id === addressId);
              if (selected) {
                setValue("shippingName", selected.contactName, {
                  shouldValidate: true,
                });
                setValue("shippingPhone", selected.phone, {
                  shouldValidate: true,
                });
                setValue(
                  "shippingAddress",
                  [
                    selected.street,
                    selected.city,
                    selected.province,
                    selected.postalCode,
                  ].join(", "),
                  { shouldValidate: true },
                );
              }
            }}
          >
            <SelectTrigger
              aria-label="Gunakan alamat tersimpan"
              className="w-full min-w-0 justify-start rounded-xl px-4 py-3 font-normal shadow-none"
            >
              <SelectValue placeholder="Isi manual" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Isi manual</SelectItem>
              {addresses.map((address) => (
                <SelectItem key={address.id} value={address.id}>
                  {address.label} · {address.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      )}
      <label className="grid gap-2 text-sm font-medium">
        Nama penerima
        <input
          autoComplete="name"
          {...register("shippingName")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.shippingName?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Nomor telepon
        <input
          autoComplete="tel"
          {...register("shippingPhone")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.shippingPhone?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Alamat lengkap
        <textarea
          autoComplete="street-address"
          rows={3}
          {...register("shippingAddress")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.shippingAddress?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Catatan untuk penjual
        <textarea
          rows={3}
          {...register("note")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.note?.message} />
      </label>
      <button
        disabled={isSubmitting}
        className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
      >
        {isSubmitting ? "Mengirim…" : "Buat pesanan"}
      </button>
    </form>
  );
}
