import Link from "next/link";

export type PageHeaderCrumb = { label: string; href?: string };
export type PageHeaderNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  navigation,
}: {
  title: string;
  description: string;
  breadcrumbs: PageHeaderCrumb[];
  navigation?: PageHeaderNavItem[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 font-serif text-[20rem] leading-none text-primary-foreground/[0.035]"
      >
        ✳
      </div>
      {navigation?.length ? (
        <nav
          aria-label="Navigasi katalog"
          className="relative z-10 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap justify-center gap-1 rounded-full bg-foreground/20 p-1.5 sm:gap-2"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus ${item.active ? "bg-primary-foreground/10 font-semibold" : ""}`}
            >
              {item.active && (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-accent-bright"
                />
              )}
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="relative z-10 mx-auto grid max-w-[1536px] gap-5 px-5 pb-9 pt-8 sm:px-8 sm:pb-12 sm:pt-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:gap-12 lg:px-12 lg:pb-14">
        <div>
          <h1 className="max-w-3xl font-serif text-4xl leading-[1.08] text-background sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <nav aria-label="Breadcrumb" className="mt-5">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-primary-foreground/80">
              {breadcrumbs.map((crumb, index) => (
                <li
                  key={`${crumb.label}-${index}`}
                  className="flex items-center gap-2"
                >
                  {index > 0 && <span aria-hidden="true">›</span>}
                  {crumb.href ? (
                    <Link
                      className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus hover:text-primary-foreground"
                      href={crumb.href}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current="page"
                      className="inline-flex min-h-8 items-center rounded-full bg-accent px-3 font-semibold text-orange-ink"
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <p className="max-w-lg text-sm leading-6 text-primary-foreground/85 lg:justify-self-end">
          {description}
        </p>
      </div>
    </section>
  );
}
