"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl">Admin Area tidak dapat dimuat</h1>
      <p className="mt-3 text-muted-foreground">
        Data belum tersedia. Coba muat ulang halaman.
      </p>
      <button
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        onClick={() => reset()}
        type="button"
      >
        Coba lagi
      </button>
    </main>
  );
}
