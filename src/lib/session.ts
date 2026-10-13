import { auth } from "../../auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@/types";
import { redirect } from "next/navigation";

function isPrefetch(requestHeaders: Headers) {
  const purpose = `${requestHeaders.get("purpose") ?? ""} ${requestHeaders.get("sec-purpose") ?? ""}`;
  return (
    requestHeaders.has("next-router-prefetch") ||
    requestHeaders.has("next-router-segment-prefetch") ||
    /prefetch/i.test(purpose)
  );
}

async function recordAuthenticatedActivity(userId: string) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 5 * 60 * 1000);
  try {
    const requestHeaders = await headers();
    if (isPrefetch(requestHeaders)) return;
    await db.user.updateMany({
      where: {
        id: userId,
        OR: [{ lastActiveAt: null }, { lastActiveAt: { lte: cutoff } }],
      },
      data: { lastActiveAt: now },
    });
  } catch {
    // Activity metrics are approximate and must not make authenticated pages fail.
  }
}

export async function recordCurrentUserActivity(expectedUserId: string) {
  const session = await auth();
  if (
    session?.user?.id !== expectedUserId ||
    !session.user.email ||
    !session.user.role
  )
    return;
  await recordAuthenticatedActivity(expectedUserId);
}

export async function getCurrentUser(
  options: { recordActivity?: boolean } = {},
): Promise<User | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !session.user?.email || !session.user.role) return null;
  if (options.recordActivity !== false) await recordAuthenticatedActivity(id);
  return {
    id,
    name: session.user.name ?? "Pengguna",
    email: session.user.email,
    city: "",
    platformRole: session.user.role,
  };
}

export async function requireCurrentUser(callbackUrl: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}
