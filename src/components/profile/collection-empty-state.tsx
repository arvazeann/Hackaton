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
    <div className="rounded-xl border border-dashed bg-stone-50 p-4">
      <p className="text-sm text-stone-600">{message}</p>
      <a
        href={href}
        className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline"
      >
        {actionLabel}
      </a>
    </div>
  );
}
