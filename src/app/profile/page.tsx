import { Shell } from "@/components/layout/shell";
import { requireCurrentUser } from "@/lib/session";
import { ProfileHub } from "@/components/profile/profile-hub";
import { getProfileHub } from "@/server/services/profile-hub";
export default async function Profile() {
  const user = await requireCurrentUser("/profile");
  const hub = await getProfileHub(user.id);
  return (
    <Shell>
      <section className="w-full">
        {hub ? (
          <ProfileHub hub={hub} />
        ) : (
          <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-2xl">Akun</h1>
            <p className="mt-4 font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        )}
      </section>
    </Shell>
  );
}
