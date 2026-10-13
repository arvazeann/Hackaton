"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { AddressDTO, PaymentAccountDTO, StoreProfileDTO } from "@/types";
import { ProfileForm } from "@/components/forms/profile-form";
import { CollectionEmptyState } from "@/components/profile/collection-empty-state";
import { NotificationPreferences } from "@/components/profile/notification-preferences";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Hub = {
  account: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    bio: string | null;
    avatarKey: string | null;
  };
  addresses: AddressDTO[];
  store: StoreProfileDTO | null;
  paymentAccounts: PaymentAccountDTO[];
  buyer: {
    activeOrders: number;
    recentOrders: {
      id: string;
      orderCode: string;
      status: string;
      productTitleSnapshot: string;
      createdAt: Date;
    }[];
  };
  seller: null | {
    pendingOrders: number;
    productsByStatus: Record<string, number>;
    completedSales: number;
    totalRevenue: number;
  };
};

const inputClass =
  "w-full rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-3 py-2.5 text-sm outline-none transition focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20";
const initialAddress = {
  kind: "SHIPPING",
  label: "",
  contactName: "",
  phone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
  isDefault: false,
};

async function send(path: string, method: string, data?: unknown) {
  const response = await fetch(path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (response.status === 204) return { ok: true, data: null };
  const body = await response.json();
  if (!response.ok || body.ok === false)
    throw new Error(body.message ?? "Permintaan gagal.");
  return body;
}

export function ProfileHub({ hub }: { hub: Hub }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [address, setAddress] =
    useState<Record<string, string | boolean>>(initialAddress);
  const [editingAddress, setEditingAddress] = useState("");
  const [store, setStore] = useState({
    storeName: hub.store?.storeName ?? "",
    description: hub.store?.description ?? "",
    logoKey: hub.store?.logoKey ?? "",
    city: hub.store?.city ?? hub.account.city ?? "",
    province: hub.store?.province ?? "",
  });
  const [payment, setPayment] = useState({
    type: "BANK",
    providerName: "",
    accountNumber: "",
    accountHolderName: "",
  });
  const [editingPaymentId, setEditingPaymentId] = useState("");
  const [logoError, setLogoError] = useState("");

  async function perform(task: () => Promise<unknown>, success: string) {
    setError("");
    setMessage("");
    try {
      await task();
      setMessage(success);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Permintaan gagal.");
    }
  }
  function editAddress(value: AddressDTO) {
    setEditingAddress(value.id);
    setAddress({ ...value });
  }
  function clearAddress() {
    setEditingAddress("");
    setAddress({ ...initialAddress });
  }
  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await perform(async () => {
      await send("/api/profile/addresses", "POST", {
        ...address,
        ...(editingAddress ? { id: editingAddress } : {}),
      });
      clearAddress();
    }, "Alamat tersimpan.");
  }
  async function uploadLogo(file?: File) {
    if (!file) return;
    setLogoError("");
    const form = new FormData();
    form.set("file", file);
    form.set("purpose", "LOGO");
    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setStore((current) => ({ ...current, logoKey: result.storageKey }));
    } catch (reason) {
      setLogoError(
        reason instanceof Error ? reason.message : "Logo gagal diunggah.",
      );
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:px-6 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <nav
        aria-label="Bagian profil"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-2 lg:sticky lg:top-20 lg:h-fit lg:flex-col"
      >
        {[
          ["overview", "Overview"],
          ["account", "Akun"],
          ["addresses", "Alamat"],
          ["store", "Toko"],
          ["notification-preferences", "Notifikasi"],
          ["vacation", "Mode liburan"],
          ["payments", "Pembayaran"],
        ].map(([id, title]) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-full border border-transparent px-4 py-2 text-sm text-[#46564c] transition hover:border-[#d9d4c8] hover:bg-[#f6f3ec] hover:text-[#174c3c] focus-visible:ring-2 focus-visible:ring-[#568270]"
          >
            {title}
          </a>
        ))}
        <Link
          href="/dashboard/products"
          className="whitespace-nowrap rounded-full border border-transparent px-4 py-2 text-sm text-[#46564c] transition hover:border-[#d9d4c8] hover:bg-[#f6f3ec] hover:text-[#174c3c] focus-visible:ring-2 focus-visible:ring-[#568270]"
        >
          Produk saya
        </Link>
      </nav>
      <div className="grid min-w-0 gap-8">
        {(message || error) && (
          <p
            role={error ? "alert" : "status"}
            className={
              error
                ? "rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
                : "rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
            }
          >
            {error || message}
          </p>
        )}
        <section
          id="overview"
          className="scroll-mt-24 rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-5 shadow-sm sm:p-6"
        >
          <h1 className="text-2xl font-bold">Ringkasan akun</h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p>
              Pesanan aktif sebagai pembeli:{" "}
              <strong>{hub.buyer.activeOrders}</strong>
            </p>
            {hub.seller && (
              <>
                <p>
                  Pesanan menunggu tindakan:{" "}
                  <strong>{hub.seller.pendingOrders}</strong>
                </p>
                <p>
                  Penjualan selesai:{" "}
                  <strong>{hub.seller.completedSales}</strong>
                </p>
                <p>
                  Total pendapatan selesai:{" "}
                  <strong>
                    Rp {hub.seller.totalRevenue.toLocaleString("id-ID")}
                  </strong>
                </p>
                <p>
                  Produk menurut status:{" "}
                  {Object.entries(hub.seller.productsByStatus)
                    .map(([status, count]) => `${status}: ${count}`)
                    .join(" · ") || "Belum ada produk"}
                </p>
              </>
            )}
          </div>
          {!hub.store && (
            <p className="mt-4 text-sm text-stone-600">
              Aktifkan toko untuk mulai menjual dan membuat produk.
            </p>
          )}
          {hub.store && hub.store.needsCompletion && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Lengkapi provinsi toko untuk membuka fitur penjualan dan membuat
              produk.
            </p>
          )}
          {hub.seller &&
            hub.seller.pendingOrders > 0 &&
            !hub.paymentAccounts.some((item) => item.isActive) && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Konfirmasi pesanan tertunda diblokir sampai toko memiliki akun
                pembayaran aktif.{" "}
                <a href="#payments" className="font-semibold underline">
                  Atur akun pembayaran
                </a>
                .
              </p>
            )}
          <div className="mt-5 grid gap-2">
            {hub.buyer.recentOrders.length ? (
              hub.buyer.recentOrders.map((order) => (
                <a
                  key={order.id}
                  href={`/orders#${order.id}`}
                  className="rounded-lg border p-3 text-sm hover:bg-stone-50"
                >
                  <strong>{order.productTitleSnapshot}</strong> ·{" "}
                  {order.orderCode} · {order.status}
                </a>
              ))
            ) : (
              <p className="text-sm text-stone-500">Belum ada pesanan.</p>
            )}
          </div>
          <a
            href="/orders"
            className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline"
          >
            Lihat semua pesanan
          </a>
        </section>
        <section
          id="account"
          className="scroll-mt-24 rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-5 shadow-sm sm:p-6"
        >
          <h2 className="mb-5 text-xl font-bold">Akun</h2>
          <ProfileForm
            user={{ ...hub.account, city: hub.account.city ?? "" }}
          />
          <PasswordForm
            onSubmit={(data) =>
              perform(
                () => send("/api/profile/password", "PATCH", data),
                "Kata sandi berhasil diubah.",
              )
            }
          />
        </section>
        <section
          id="addresses"
          className="scroll-mt-24 rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-xl font-bold">Buku alamat</h2>
          <p className="mt-1 text-sm text-stone-600">
            Maksimal 10 alamat pengiriman dan 1 alamat pickup.
          </p>
          <div className="mt-4 grid gap-3">
            {hub.addresses.length === 0 && (
              <CollectionEmptyState
                message="Kamu belum menyimpan alamat pengiriman atau pickup."
                href="#address-form"
                actionLabel="Tambah alamat pertama"
              />
            )}
            {hub.addresses.map((item) => (
              <article key={item.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>
                    {item.label}
                    {item.isDefault ? " · Default" : ""}
                  </strong>
                  <span className="text-xs">{item.kind}</span>
                </div>
                <p className="mt-1 text-sm">
                  {item.contactName} · {item.phone}
                  <br />
                  {item.street}, {item.city}, {item.province} {item.postalCode}
                </p>
                <div className="mt-2 flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => editAddress(item)}
                    className="underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Hapus alamat ini? Snapshot pengiriman order lama tidak berubah.",
                        )
                      )
                        void perform(
                          () =>
                            send(`/api/profile/addresses/${item.id}`, "DELETE"),
                          "Alamat dihapus.",
                        );
                    }}
                    className="text-rose-700 underline"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
          <form
            id="address-form"
            onSubmit={saveAddress}
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            <h3 className="sm:col-span-2 font-semibold">
              {editingAddress ? "Edit alamat" : "Tambah alamat"}
            </h3>
            <Select
              aria-label="Jenis alamat"
              value={String(address.kind)}
              onValueChange={(kind) => setAddress({ ...address, kind })}
            >
              <SelectTrigger
                aria-label="Jenis alamat"
                className={`${inputClass} min-w-0 justify-start shadow-none`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHIPPING">Pengiriman</SelectItem>
                <SelectItem value="PICKUP">Pickup</SelectItem>
              </SelectContent>
            </Select>
            <input
              aria-label="Label alamat"
              placeholder="Label"
              required
              className={inputClass}
              value={String(address.label)}
              onChange={(e) =>
                setAddress({ ...address, label: e.target.value })
              }
            />
            {(
              [
                ["contactName", "Nama kontak"],
                ["phone", "Telepon"],
                ["street", "Alamat jalan"],
                ["city", "Kota"],
                ["province", "Provinsi"],
                ["postalCode", "Kode pos"],
              ] as const
            ).map(([key, title]) => (
              <input
                key={key}
                aria-label={title}
                placeholder={title}
                required
                className={inputClass}
                value={String(address[key] ?? "")}
                onChange={(e) =>
                  setAddress({ ...address, [key]: e.target.value })
                }
              />
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(address.isDefault)}
                onChange={(e) =>
                  setAddress({ ...address, isDefault: e.target.checked })
                }
              />
              Jadikan default
            </label>
            <div className="flex gap-2">
              <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">
                Simpan alamat
              </button>
              {editingAddress && (
                <button
                  type="button"
                  onClick={clearAddress}
                  className="rounded-full border px-4 py-2 text-sm"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>
        <section
          id="store"
          className="scroll-mt-24 rounded-2xl border border-[#e3ded2] bg-[#fffefa] p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-xl font-bold">
            {hub.store ? "Profil toko" : "Aktifkan toko"}
          </h2>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void perform(
                () =>
                  send("/api/profile/store", "PUT", {
                    ...store,
                    logoKey: store.logoKey || null,
                  }),
                "Profil toko tersimpan.",
              );
            }}
          >
            <input
              aria-label="Nama toko"
              placeholder="Nama toko"
              required
              minLength={2}
              maxLength={100}
              className={inputClass}
              value={store.storeName}
              onChange={(e) =>
                setStore({ ...store, storeName: e.target.value })
              }
            />
            {hub.store && (
              <p className="text-xs text-stone-500">
                URL toko:{" "}
                <Link className="underline" href={`/store/${hub.store.slug}`}>
                  /store/{hub.store.slug}
                </Link>
                . Slug tidak dapat diubah.
              </p>
            )}
            <textarea
              aria-label="Deskripsi toko"
              placeholder="Deskripsi toko"
              rows={3}
              maxLength={500}
              className={inputClass}
              value={store.description}
              onChange={(e) =>
                setStore({ ...store, description: e.target.value })
              }
            />
            <input
              aria-label="Kota toko"
              placeholder="Kota"
              required
              className={inputClass}
              value={store.city}
              onChange={(e) => setStore({ ...store, city: e.target.value })}
            />
            <input
              aria-label="Provinsi toko"
              placeholder="Provinsi"
              required
              className={inputClass}
              value={store.province}
              onChange={(e) => setStore({ ...store, province: e.target.value })}
            />
            {store.logoKey && (
              <Image
                src={`/uploads/${store.logoKey}`}
                alt={`Logo toko ${store.storeName}`}
                width={80}
                height={80}
                unoptimized
                className="size-20 rounded-xl object-cover"
              />
            )}
            <label className="grid gap-1 text-sm">
              Logo toko
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  void uploadLogo(e.currentTarget.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {logoError && (
              <p role="alert" className="text-sm text-rose-700">
                {logoError}
              </p>
            )}
            <button className="w-fit rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">
              {hub.store ? "Simpan profil toko" : "Aktifkan toko"}
            </button>
          </form>
        </section>
        <NotificationPreferences />
        {hub.store && (
          <section
            id="vacation"
            className="scroll-mt-24 rounded-2xl border bg-white p-5"
          >
            <h2 className="text-xl font-bold">Mode liburan toko</h2>
            <p className="mt-1 text-sm text-stone-600">
              Saat aktif, produk tidak tampil di beranda atau pencarian dan
              pesanan baru dinonaktifkan. Pesanan yang sudah ada tetap dapat
              diproses.
            </p>
            <button
              type="button"
              aria-pressed={hub.store.isOnVacation}
              onClick={() =>
                void perform(
                  () =>
                    send("/api/profile/store", "PATCH", {
                      isOnVacation: !hub.store?.isOnVacation,
                    }),
                  hub.store?.isOnVacation
                    ? "Mode liburan dinonaktifkan."
                    : "Mode liburan diaktifkan.",
                )
              }
              className={`mt-4 rounded-full px-4 py-2 text-sm font-semibold ${hub.store.isOnVacation ? "bg-amber-100 text-amber-900" : "bg-emerald-800 text-white"}`}
            >
              {hub.store.isOnVacation
                ? "Nonaktifkan mode liburan"
                : "Aktifkan mode liburan"}
            </button>
          </section>
        )}
        {hub.store && (
          <section
            id="payments"
            className="scroll-mt-24 rounded-2xl border bg-white p-5"
          >
            <h2 className="text-xl font-bold">Akun pembayaran</h2>
            <p className="mt-1 text-sm text-stone-600">
              Nomor rekening dienkripsi dan hanya ditampilkan kepada buyer
              setelah order dikonfirmasi.
            </p>
            <div className="mt-4 grid gap-3">
              {hub.paymentAccounts.length === 0 && (
                <CollectionEmptyState
                  message="Belum ada akun pembayaran untuk menerima pembayaran pesanan."
                  href="#payment-form"
                  actionLabel="Tambah akun pembayaran pertama"
                />
              )}
              {hub.paymentAccounts.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <p className="text-sm">
                    <strong>{item.providerName}</strong> ····{" "}
                    {item.accountNumberLast4}
                    <br />
                    {item.accountHolderName} ·{" "}
                    {item.isActive ? "Aktif" : "Nonaktif"}
                  </p>
                  <div className="flex gap-3 text-sm">
                    {item.isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPaymentId(item.id);
                          setPayment({
                            type: item.type,
                            providerName: item.providerName,
                            accountNumber: "",
                            accountHolderName: item.accountHolderName,
                          });
                        }}
                        className="underline"
                      >
                        Ganti rincian
                      </button>
                    )}
                    {item.isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Nonaktifkan akun pembayaran ini? Snapshot pesanan yang sudah dikonfirmasi tetap tersimpan.",
                            )
                          )
                            void perform(
                              () =>
                                send(
                                  `/api/profile/payments/${item.id}`,
                                  "DELETE",
                                ),
                              "Akun pembayaran dinonaktifkan.",
                            );
                        }}
                        className="text-rose-700 underline"
                      >
                        Nonaktifkan
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <form
              id="payment-form"
              className="mt-5 grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void perform(
                  async () => {
                    await send("/api/profile/payments", "POST", {
                      ...payment,
                      ...(editingPaymentId ? { id: editingPaymentId } : {}),
                    });
                    setEditingPaymentId("");
                    setPayment({
                      type: "BANK",
                      providerName: "",
                      accountNumber: "",
                      accountHolderName: "",
                    });
                  },
                  editingPaymentId
                    ? "Rincian akun pembayaran diperbarui."
                    : "Akun pembayaran tersimpan.",
                );
              }}
            >
              <h3 className="sm:col-span-2 font-semibold">
                {editingPaymentId
                  ? "Ganti rincian akun (nomor lama tidak dapat dibaca)"
                  : "Tambah akun aktif (maksimal tiga)"}
              </h3>
              <Select
                value={payment.type}
                onValueChange={(type) => setPayment({ ...payment, type })}
              >
                <SelectTrigger
                  aria-label="Jenis akun"
                  className={`${inputClass} min-w-0 justify-start shadow-none`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">Bank</SelectItem>
                  <SelectItem value="EWALLET">E-wallet</SelectItem>
                </SelectContent>
              </Select>
              <input
                aria-label="Nama bank atau penyedia"
                required
                placeholder="Nama bank / e-wallet"
                className={inputClass}
                value={payment.providerName}
                onChange={(e) =>
                  setPayment({ ...payment, providerName: e.target.value })
                }
              />
              <input
                aria-label="Nomor rekening atau akun"
                required
                autoComplete="off"
                placeholder={
                  editingPaymentId
                    ? "Masukkan nomor rekening / akun baru"
                    : "Nomor rekening / akun"
                }
                className={inputClass}
                value={payment.accountNumber}
                onChange={(e) =>
                  setPayment({ ...payment, accountNumber: e.target.value })
                }
              />
              <input
                aria-label="Nama pemilik rekening"
                required
                placeholder="Nama pemilik"
                className={inputClass}
                value={payment.accountHolderName}
                onChange={(e) =>
                  setPayment({ ...payment, accountHolderName: e.target.value })
                }
              />
              <button className="w-fit rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">
                {editingPaymentId ? "Simpan rincian baru" : "Simpan akun"}
              </button>
              {editingPaymentId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPaymentId("");
                    setPayment({
                      type: "BANK",
                      providerName: "",
                      accountNumber: "",
                      accountHolderName: "",
                    });
                  }}
                  className="w-fit rounded-full border px-4 py-2 text-sm"
                >
                  Batal
                </button>
              )}
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

function PasswordForm({
  onSubmit,
}: {
  onSubmit: (data: { currentPassword: string; newPassword: string }) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  return (
    <form
      className="mt-8 grid gap-3 border-t pt-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
      }}
    >
      <h3 className="font-semibold">Ganti kata sandi</h3>
      <input
        aria-label="Kata sandi saat ini"
        required
        type="password"
        autoComplete="current-password"
        placeholder="Kata sandi saat ini"
        className={inputClass}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <input
        aria-label="Kata sandi baru"
        required
        minLength={8}
        type="password"
        autoComplete="new-password"
        placeholder="Kata sandi baru (minimal 8 karakter)"
        className={inputClass}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button className="w-fit rounded-full border px-4 py-2 text-sm font-semibold">
        Ubah kata sandi
      </button>
    </form>
  );
}
