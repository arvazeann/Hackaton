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
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs font-bold tracking-[.14em] text-[#568270]">
          PEMBARUAN AKUN
        </p>
        <h1 className="mb-7 mt-1 text-3xl font-bold text-[#26332d]">
          Notifikasi
        </h1>
        <NotificationList data={result} />
      </section>
    </Shell>
  );
}
