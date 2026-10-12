function getSafeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { type: "UnknownError" };

  const type = error instanceof Error ? error.name : "UnknownError";
  const code =
    "code" in error && typeof error.code === "string" ? error.code : undefined;

  return { type, ...(code ? { code } : {}) };
}

export function logAuthFailure(operation: string, error: unknown) {
  console.error(`[auth] ${operation} failed`, getSafeErrorDetails(error));
}
