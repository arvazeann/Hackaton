import { auth } from "../../auth";
import type { User } from "@/types";
import { redirect } from "next/navigation";

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !session.user?.email) return null;
  return {
    id,
    name: session.user.name ?? "Pengguna",
    email: session.user.email,
    city: "",
  };
}

export async function requireCurrentUser(callbackUrl: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}
