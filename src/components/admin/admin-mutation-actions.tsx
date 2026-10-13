"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AdminProductDTO } from "@/types/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function send(url: string, method: "PATCH" | "POST", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Aksi gagal. Coba lagi.";
    throw new Error(message);
  }
  return payload;
}

export function AdminUserActions({
  id,
  name: initialName,
  isDisabled,
}: {
  id: string;
  name: string;
  isDisabled: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await send(`/api/admin/users/${id}`, "PATCH", { name });
      setMessage("Nama berhasil disimpan.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function changeState() {
    setBusy(true);
    setMessage("");
    try {
      await send(`/api/admin/users/${id}/account-state`, "POST", {
        action: isDisabled ? "enable" : "disable",
      });
      setMessage(isDisabled ? "Akun diaktifkan." : "Akun dinonaktifkan.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-64 space-y-2">
      <form className="flex gap-2" onSubmit={updateName}>
        <label className="sr-only" htmlFor={`admin-name-${id}`}>
          Nama pengguna
        </label>
        <input
          id={`admin-name-${id}`}
          className="min-w-0 flex-1 rounded border px-2 py-1"
          maxLength={100}
          minLength={2}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          className="rounded border px-2 py-1 text-xs disabled:opacity-50"
          disabled={busy || name === initialName}
          type="submit"
        >
          Simpan nama
        </button>
      </form>
      <button
        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
        disabled={busy}
        onClick={changeState}
        type="button"
      >
        {isDisabled ? "Aktifkan akun" : "Nonaktifkan akun"}
      </button>
      <p aria-live="polite" className="text-xs text-stone-600">
        {message}
      </p>
    </div>
  );
}

export function AdminProductActions({
  product,
  categories,
}: {
  product: AdminProductDTO;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const editable = product.status === "active" && !product.hasOpenOrder;

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      price: Number(form.get("price")),
      categoryId: String(form.get("categoryId") ?? ""),
      condition: String(form.get("condition") ?? ""),
      city: String(form.get("city") ?? ""),
    };
    setBusy(true);
    setMessage("");
    try {
      await send(`/api/admin/products/${product.id}`, "PATCH", payload);
      setMessage("Produk berhasil diperbarui.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    setBusy(true);
    setMessage("");
    try {
      await send(`/api/admin/products/${product.id}/archive`, "POST", {});
      setMessage("Produk diarsipkan.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  if (!editable)
    return (
      <span className="text-xs text-stone-500">
        {product.hasOpenOrder ? "Ada pesanan terbuka" : "Tidak dapat diubah"}
      </span>
    );
  return (
    <div className="min-w-64 space-y-2">
      <details>
        <summary className="cursor-pointer text-xs font-medium underline">
          Edit informasi
        </summary>
        <form className="mt-2 grid gap-2 rounded border p-3" onSubmit={update}>
          <label className="text-xs">
            Judul
            <input
              className="mt-1 w-full rounded border p-2 text-sm"
              name="title"
              defaultValue={product.title}
              minLength={3}
              maxLength={150}
              required
            />
          </label>
          <label className="text-xs">
            Deskripsi
            <textarea
              className="mt-1 w-full rounded border p-2 text-sm"
              name="description"
              defaultValue={product.description}
              maxLength={5000}
              required
            />
          </label>
          <label className="text-xs">
            Harga
            <input
              className="mt-1 w-full rounded border p-2 text-sm"
              name="price"
              type="number"
              defaultValue={product.price}
              min={1}
              max={1000000000}
              required
            />
          </label>
          <label className="text-xs">
            Kategori
            <Select name="categoryId" defaultValue={product.categoryId}>
              <SelectTrigger
                aria-label="Kategori produk"
                className="mt-1 w-full min-w-0 justify-start rounded p-2 text-sm shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="text-xs">
            Kondisi
            <Select name="condition" defaultValue={product.condition}>
              <SelectTrigger
                aria-label="Kondisi produk"
                className="mt-1 w-full min-w-0 justify-start rounded p-2 text-sm shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="like_new">Like new</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="text-xs">
            Kota
            <input
              className="mt-1 w-full rounded border p-2 text-sm"
              name="city"
              defaultValue={product.city}
              required
            />
          </label>
          <button
            className="rounded bg-emerald-800 px-3 py-2 text-white disabled:opacity-50"
            disabled={busy}
            type="submit"
          >
            Simpan
          </button>
        </form>
      </details>
      <button
        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
        disabled={busy}
        onClick={archive}
        type="button"
      >
        Arsipkan
      </button>
      <p aria-live="polite" className="text-xs text-stone-600">
        {message}
      </p>
    </div>
  );
}

export function AdminOrderCancelAction({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const result = await send(`/api/admin/orders/${orderId}/cancel`, "POST", {
        reason: String(form.get("reason") ?? ""),
      });
      const notifications =
        typeof result === "object" &&
        result !== null &&
        "notifications" in result
          ? result.notifications
          : null;
      setMessage(
        notifications && JSON.stringify(notifications).includes('"failed"')
          ? "Pesanan dibatalkan, tetapi notifikasi gagal dikirim setelah beberapa percobaan."
          : "Pesanan dibatalkan; notifikasi diproses sesuai preferensi.",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details>
      <summary className="cursor-pointer text-xs font-medium underline">
        Batalkan order pending
      </summary>
      <form className="mt-2 grid min-w-56 gap-2" onSubmit={cancel}>
        <label className="text-xs">
          Alasan (5–500 karakter)
          <textarea
            className="mt-1 w-full rounded border p-2 text-sm"
            name="reason"
            minLength={5}
            maxLength={500}
            required
          />
        </label>
        <button
          className="rounded bg-rose-800 px-3 py-2 text-white disabled:opacity-50"
          disabled={busy}
          type="submit"
        >
          Batalkan order
        </button>
        <p aria-live="polite" className="text-xs text-stone-600">
          {message}
        </p>
      </form>
    </details>
  );
}
