"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NotificationDTO } from "@/types";

type Page = {
  items: NotificationDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadCount: number;
};

export function NotificationList({ data }: { data: Page }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function markAll() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Notifikasi gagal diperbarui.");
      setMessage("Semua notifikasi telah dibaca.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Permintaan gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function markOne(id: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Notifikasi gagal diperbarui.");
      setMessage("Notifikasi telah dibaca.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Permintaan gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data.total} notifikasi</p>
        <button
          type="button"
          onClick={() => void markAll()}
          disabled={busy || data.unreadCount === 0}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tandai semua sebagai dibaca
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-status-error-ink">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-sm text-primary">
          {message}
        </p>
      )}
      {data.items.length ? (
        <ul className="grid gap-3">
          {data.items.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl border p-4 shadow-sm ${item.readAt ? "border-border bg-card" : "border-sage bg-sage-surface"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2>{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("id-ID")}
                  </p>
                  {item.orderId && (
                    <Link
                      href={`/orders?orderId=${encodeURIComponent(item.orderId)}`}
                      className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4"
                    >
                      Lihat pesanan
                    </Link>
                  )}
                </div>
                {!item.readAt && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void markOne(item.id)}
                    className="text-sm font-semibold underline disabled:opacity-50"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="text-foreground">Belum ada notifikasi</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pembaruan pesanan akan muncul di sini.
          </p>
        </div>
      )}
      {data.totalPages > 1 && (
        <nav
          aria-label="Halaman notifikasi"
          className="mt-6 flex justify-center gap-4"
        >
          {data.page > 1 && (
            <Link href={`/notifications?page=${data.page - 1}`}>
              Sebelumnya
            </Link>
          )}
          <span className="text-sm">
            {data.page} / {data.totalPages}
          </span>
          {data.page < data.totalPages && (
            <Link href={`/notifications?page=${data.page + 1}`}>
              Berikutnya
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
