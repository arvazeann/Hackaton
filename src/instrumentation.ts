export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { validatePaymentEncryptionKey } =
    await import("@/server/security/payment-encryption");
  validatePaymentEncryptionKey();
}
