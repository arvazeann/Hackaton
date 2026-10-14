const CALLBACK_ORIGIN = "https://ruanglagi.invalid";

export function getSafeCallbackUrl(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const callback = new URL(value, CALLBACK_ORIGIN);
    if (callback.origin !== CALLBACK_ORIGIN) return "/";
    return `${callback.pathname}${callback.search}${callback.hash}`;
  } catch {
    return "/";
  }
}

export function getGoogleAuthErrorMessage(error: string | null): string | null {
  switch (error) {
    case "AccessDenied":
      return "Login Google tidak diizinkan atau dibatalkan. Pastikan akun memenuhi syarat, lalu coba lagi.";
    case "OAuthAccountNotLinked":
      return "Akun ini belum dapat ditautkan. Coba masuk dengan metode yang sebelumnya digunakan.";
    case "OAuthSignin":
    case "OAuthCallbackError":
    case "OAuthCreateAccount":
    case "CallbackRouteError":
    case "Configuration":
      return "Login Google belum berhasil. Periksa koneksi lalu coba lagi.";
    default:
      return error ? "Login belum berhasil. Coba lagi." : null;
  }
}
