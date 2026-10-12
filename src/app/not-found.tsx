import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-bold text-emerald-700">404 · TIDAK DITEMUKAN</p>
        <h1 className="mt-3 text-4xl font-bold">Halaman ini tidak ada</h1>
        <p className="mt-3 text-stone-500">
          Barang atau halaman yang kamu cari mungkin sudah tidak tersedia.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-emerald-800 px-6 py-3 text-white"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
