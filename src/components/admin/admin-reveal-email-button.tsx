"use client";

import { useState } from "react";

export function AdminRevealEmailButton({
  userId,
  maskedEmail,
}: {
  userId: string;
  maskedEmail: string;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reveal-email`, {
        method: "POST",
      });
      const payload: unknown = await response.json();
      if (
        !response.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("email" in payload) ||
        typeof payload.email !== "string"
      ) {
        setError("Email tidak dapat dibuka. Coba lagi.");
        return;
      }
      setEmail(payload.email);
    } catch {
      setError("Email tidak dapat dibuka. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>{email ?? maskedEmail}</span>
      {!email && (
        <button
          className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-secondary disabled:opacity-60"
          type="button"
          disabled={loading}
          onClick={reveal}
        >
          {loading ? "Mencatat audit…" : "Buka email"}
        </button>
      )}
      {error && (
        <span role="alert" className="text-xs text-status-error-ink">
          {error}
        </span>
      )}
      {email && (
        <span className="sr-only" role="status">
          Email dibuka dan dicatat di audit log.
        </span>
      )}
    </div>
  );
}
