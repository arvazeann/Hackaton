type ErrorSignals = { codes: Set<string>; messages: string[] };

const nestedErrorKeys = [
  "cause",
  "meta",
  "driverAdapterError",
  "originalError",
];

function safeServerMessage(messages: string[]) {
  const message = messages.find((value) => value.length > 0);
  if (!message) return undefined;
  return message
    .replace(
      /(?:postgres(?:ql)?|mysql):\/\/[^\s"'`]+/gi,
      "[connection URL redacted]",
    )
    .replace(
      /\b(password|passwd|secret|token|api[_-]?key)\b\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1=[redacted]",
    )
    .replace(/\bpostgres(?:\.[a-z0-9_-]+)?:[^@\s]+@/gi, "postgres:[redacted]@")
    .replace(
      /\b(?:aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com|[a-z0-9]{20}\.supabase\.co)\b/gi,
      "[database host]",
    )
    .slice(0, 240);
}

function collectSignals(
  value: unknown,
  signals: ErrorSignals,
  seen = new Set<object>(),
  depth = 0,
) {
  if (
    typeof value !== "object" ||
    value === null ||
    depth > 6 ||
    seen.has(value)
  )
    return;

  seen.add(value);
  const record = value as Record<string, unknown>;
  if (typeof record.code === "string")
    signals.codes.add(record.code.toUpperCase());
  if (typeof record.message === "string") {
    signals.messages.push(record.message);
    for (const match of record.message.matchAll(
      /\b(?:code|sqlstate)\s*:\s*([a-z0-9]{5})\b/gi,
    )) {
      signals.codes.add(match[1].toUpperCase());
    }
    for (const match of record.message.matchAll(
      /\b(ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|ESOCKETTIMEDOUT|ECONNRESET|EMAXCONNSESSION)\b/gi,
    )) {
      signals.codes.add(match[1].toUpperCase());
    }
  }

  for (const key of nestedErrorKeys) {
    collectSignals(record[key], signals, seen, depth + 1);
  }
}

/** Produces a safe category without echoing raw driver messages or connection URLs. */
export function describeStagingDatabaseError(error: unknown): string {
  const signals: ErrorSignals = { codes: new Set(), messages: [] };
  collectSignals(error, signals);
  const codes = [...signals.codes];
  const messages = signals.messages.join(" ").toLowerCase();
  const codeSuffix = codes.length ? ` (${codes.join(", ")})` : "";
  const serverMessage = safeServerMessage(signals.messages);

  if (
    codes.includes("EMAXCONNSESSION") ||
    /max clients.*session mode/.test(messages)
  )
    return `Pooler session connection limit reached${codeSuffix}.`;
  if (codes.some((code) => ["ENOTFOUND", "EAI_AGAIN"].includes(code)))
    return `Database hostname could not be resolved${codeSuffix}. Check the host privately in the staging connection string.`;
  if (codes.includes("ECONNREFUSED"))
    return `TCP connection was refused by the database endpoint${codeSuffix}. Check the staging host and port privately.`;
  if (codes.some((code) => ["ETIMEDOUT", "ESOCKETTIMEDOUT"].includes(code)))
    return `Database connection timed out${codeSuffix}. Network routing, firewall, or endpoint availability remains to be checked.`;
  if (codes.includes("ECONNRESET"))
    return `Database connection was reset${codeSuffix}. Check network stability and pooler availability.`;
  if (
    codes.some((code) => code.startsWith("ERR_TLS")) ||
    /certificate verify failed|ssl is required|tls handshake/.test(messages)
  )
    return `Database TLS negotiation failed${codeSuffix}. Check the staging endpoint's SSL requirements.`;
  if (
    codes.some((code) => ["P1000", "28P01"].includes(code)) ||
    /password authentication failed|authentication failed/.test(messages)
  )
    return `Database authentication failed${codeSuffix}. Recheck the staging credentials locally.`;
  if (codes.includes("P1013"))
    return `Prisma rejected the database connection string${codeSuffix}. Check its format locally.`;
  if (codes.includes("P1001"))
    return `Prisma could not reach the database${codeSuffix}; no lower-level socket cause was exposed, so hostname, port, and network causes cannot yet be distinguished.`;
  if (codes.includes("P2024"))
    return `Prisma timed out waiting for a database pool connection${codeSuffix}.`;
  if (
    codes.includes("P2010") &&
    /prepared statement .* (does not exist|already exists)|prepared statement.*pooler/.test(
      messages,
    )
  )
    return `Raw query failed because prepared statement state was unavailable through the pooler${codeSuffix}. Check the staging pooler mode and Prisma connection settings.`;
  if (codes.includes("P2010") && serverMessage)
    return `Prisma raw query failed${codeSuffix}. Sanitized driver detail: ${serverMessage}`;

  return `Staging database connection failed${codeSuffix}. Raw driver details were suppressed to protect credentials.`;
}
