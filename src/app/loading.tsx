export default function Loading() {
  return (
    <main
      aria-live="polite"
      className="mx-auto max-w-7xl animate-pulse px-4 py-12"
    >
      <div className="h-8 w-56 rounded bg-muted" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[4/3] rounded-2xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Memuat barang…</span>
    </main>
  );
}
