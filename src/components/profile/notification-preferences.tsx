"use client";

import { useEffect, useState } from "react";
import type { NotificationPreferenceDTO } from "@/types";

const labels: Record<NotificationPreferenceDTO["type"], string> = {
  ORDER_PLACED: "Pesanan baru untuk toko saya",
  ORDER_CONFIRMED: "Pesanan dikonfirmasi",
  ORDER_REJECTED: "Pesanan ditolak",
  ORDER_CANCELLED: "Pesanan dibatalkan",
  ORDER_COMPLETED: "Pesanan selesai",
};

export function NotificationPreferences() {
  const [items, setItems] = useState<NotificationPreferenceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/profile/notification-preferences")
      .then(async (response) => {
        if (!response.ok) throw new Error("Preferensi gagal dimuat.");
        return (await response.json()) as {
          preferences: NotificationPreferenceDTO[];
        };
      })
      .then((data) => {
        if (active) setItems(data.preferences);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : "Permintaan gagal.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: items }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || result.ok === false)
        throw new Error(result.message ?? "Preferensi gagal disimpan.");
      setMessage("Preferensi notifikasi tersimpan.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Permintaan gagal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="notification-preferences"
      className="scroll-mt-24 rounded-2xl border bg-white p-5"
    >
      <h2 className="text-xl font-bold">Preferensi notifikasi</h2>
      <p className="mt-1 text-sm text-stone-600">
        Status pesanan tetap tersedia di halaman pesanan meski notifikasi
        dimatikan.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-stone-500" role="status">
          Memuat preferensi…
        </p>
      ) : (
        <>
          <fieldset className="mt-4 grid gap-3">
            <legend className="sr-only">Jenis notifikasi yang diterima</legend>
            {items.map((item) => (
              <label
                key={item.type}
                className="flex items-center gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.type === item.type
                          ? { ...entry, enabled: event.target.checked }
                          : entry,
                      ),
                    )
                  }
                />
                {labels[item.type]}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            disabled={saving || items.length !== 5}
            onClick={() => void save()}
            className="mt-4 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan preferensi"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
    </section>
  );
}
