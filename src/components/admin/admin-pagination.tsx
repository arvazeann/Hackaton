import Link from "next/link";

export function AdminPagination({
  page,
  pageSize,
  totalPages,
  query,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  query: Record<string, string | undefined>;
}) {
  function href(nextPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== "") params.set(key, value);
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));
    return `?${params.toString()}`;
  }

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-6 flex items-center justify-between gap-4 text-sm"
    >
      <span>
        Halaman {page} dari {Math.max(totalPages, 1)} · {pageSize} per halaman
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className="rounded-lg border px-3 py-2" href={href(page - 1)}>
            Sebelumnya
          </Link>
        ) : (
          <span className="rounded-lg border px-3 py-2 text-muted-foreground">
            Sebelumnya
          </span>
        )}
        {page < totalPages ? (
          <Link className="rounded-lg border px-3 py-2" href={href(page + 1)}>
            Berikutnya
          </Link>
        ) : (
          <span className="rounded-lg border px-3 py-2 text-muted-foreground">
            Berikutnya
          </span>
        )}
      </div>
    </nav>
  );
}
