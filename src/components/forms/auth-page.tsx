import { AuthExperience } from "@/components/forms/auth-experience";
import { Shell } from "@/components/layout/shell";

export function AuthPage({
  initialMode,
}: {
  initialMode: "login" | "register";
}) {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <Shell>
      <AuthExperience initialMode={initialMode} googleEnabled={googleEnabled} />
    </Shell>
  );
}
