import { Shell } from "@/components/layout/shell";
import { requireCurrentUser } from "@/lib/session";
import { ProfileHub } from "@/components/profile/profile-hub";
import { getProfileHub } from "@/server/services/profile-hub";
export default async function Profile() {
  const user = await requireCurrentUser("/profile");
  const hub = await getProfileHub(user.id);
  return (
    <Shell>
      <section className="w-full py-4">
        {hub ? (
          <ProfileHub hub={hub} />
        ) : (
          <div className="rounded-2xl border bg-white p-6">
            <h1 className="text-2xl font-bold">Akun</h1>
            <p className="mt-4 font-medium">{user.name}</p>
            <p className="text-sm text-stone-500">{user.email}</p>
          </div>
        )}
      </section>
    </Shell>
  );
}
