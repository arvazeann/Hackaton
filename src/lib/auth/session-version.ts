export function isSessionVersionCurrent(
  tokenVersion: number | undefined,
  account: { disabledAt: Date | null; sessionVersion: number } | null,
) {
  return Boolean(
    account &&
    account.disabledAt === null &&
    (tokenVersion ?? 0) === account.sessionVersion,
  );
}
