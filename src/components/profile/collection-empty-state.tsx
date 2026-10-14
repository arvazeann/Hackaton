export function CollectionEmptyState({
  message,
  href,
  actionLabel,
}: {
  message: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-secondary p-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      <a
        href={href}
        className="mt-2 inline-block text-sm font-semibold text-primary underline"
      >
        {actionLabel}
      </a>
    </div>
  );
}
