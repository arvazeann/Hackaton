import { signIn } from "next-auth/react";

export type CredentialsSignInResult = "success" | "invalid" | "unavailable";

export async function signInWithCredentials(
  email: string,
  password: string,
  redirectTo: string,
): Promise<CredentialsSignInResult> {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo,
    });

    if (!result) return "unavailable";
    if (result.error === "CredentialsSignin") return "invalid";
    if (result.error) return "unavailable";
    return "success";
  } catch {
    return "unavailable";
  }
}
