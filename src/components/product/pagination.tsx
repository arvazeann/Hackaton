import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PageItem = number | "ellipsis";

function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 4, "ellipsis", pageCount];
  if (page >= pageCount - 2)
    return [
      1,
      "ellipsis",
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", pageCount];
}

function pageHref(page: number, searchParams: Record<string, string>): string {
  const params = new URLSearchParams({ ...searchParams, page: String(page) });
  return `/products?${params.toString()}`;
}

const pageLinkBase =
  "grid size-11 place-items-center rounded-pill border text-sm font-semibold transition-colors duration-control ease-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus";

export function ProductPagination({
  page,
  pageCount,
  searchParams,
}: {
  page: number;
  pageCount: number;
  searchParams: Record<string, string>;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="Halaman katalog"
      className="mt-8 flex items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link
          aria-label="Halaman sebelumnya"
          className={`${pageLinkBase} border-border bg-card text-foreground hover:border-accent-bright hover:text-primary`}
          href={pageHref(page - 1, searchParams)}
        >
          <ChevronLeft aria-hidden="true" size={17} />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={`${pageLinkBase} border-border/60 bg-muted text-muted-foreground`}
        >
          <ChevronLeft size={17} />
        </span>
      )}
      {getPageItems(page, pageCount).map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="grid size-8 place-items-center text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            aria-label={`Halaman ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={`${pageLinkBase} ${item === page ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-accent-bright hover:text-primary"}`}
            href={pageHref(item, searchParams)}
          >
            {String(item).padStart(2, "0")}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link
          aria-label="Halaman berikutnya"
          className={`${pageLinkBase} border-border bg-card text-foreground hover:border-accent-bright hover:text-primary`}
          href={pageHref(page + 1, searchParams)}
        >
          <ChevronRight aria-hidden="true" size={17} />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={`${pageLinkBase} border-border/60 bg-muted text-muted-foreground`}
        >
          <ChevronRight size={17} />
        </span>
      )}
    </nav>
  );
}
