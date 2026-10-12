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
        <p className="text-sm font-bold text-rose-700">TERJADI KESALAHAN</p>
        <h1 className="mt-3 text-3xl font-bold">Halaman gagal dimuat</h1>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-full bg-emerald-800 px-6 py-3 text-white"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
