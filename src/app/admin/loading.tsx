export default function AdminLoading() {
  return (
    <main
      aria-live="polite"
      className="mx-auto max-w-7xl animate-pulse px-4 py-8"
    >
      <div className="h-9 w-64 rounded bg-stone-200" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-24 rounded-xl bg-stone-100" />
        ))}
      </div>
      <p className="sr-only">Memuat Admin Area…</p>
    </main>
  );
}
