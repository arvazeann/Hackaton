"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-bold text-status-error-ink">
          TERJADI KESALAHAN
        </p>
        <h1 className="mt-3 text-3xl">Halaman gagal dimuat</h1>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
