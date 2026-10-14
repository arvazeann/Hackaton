import { Shell } from "@/components/layout/shell";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireCurrentUser } from "@/lib/session";
import { getNotifications } from "@/server/services/notifications";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCurrentUser("/notifications");
  const params = await searchParams;
  const result = await getNotifications(user.id, {
    page: Array.isArray(params.page) ? params.page[0] : params.page,
  });
  return (
    <Shell>
      <section className="mx-auto max-w-4xl px-4 py-9 sm:px-6 sm:py-12">
        <p className="text-xs font-bold tracking-[.14em] text-primary">
          PEMBARUAN AKUN
        </p>
        <h1 className="mb-7 mt-1 font-serif text-3xl text-foreground lg:text-4xl">
          Notifikasi
        </h1>
        <NotificationList data={result} />
      </section>
    </Shell>
  );
}
