import { isIPv4 } from "node:net";
import { networkInterfaces } from "node:os";

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function getTrustedDevHosts() {
  const currentLanHosts = Object.values(networkInterfaces())
    .flatMap((addresses) => addresses ?? [])
    .filter(
      (address) =>
        address.family === "IPv4" &&
        !address.internal &&
        isPrivateIpv4(address.address),
    )
    .map((address) => address.address);
  const configuredHost = process.env.NEXT_ALLOWED_DEV_ORIGIN?.trim();
  const configuredHostIsCurrent =
    configuredHost &&
    (!isIPv4(configuredHost) || currentLanHosts.includes(configuredHost));

  return [
    ...new Set([
      ...currentLanHosts,
      ...(configuredHost && configuredHostIsCurrent ? [configuredHost] : []),
    ]),
  ];
}

export function normalizeDevAuthRequest(
  request: Request,
  trustedDevHosts = getTrustedDevHosts(),
) {
  if (process.env.NODE_ENV === "production") return request;

  const host = request.headers.get("host")?.toLowerCase();
  if (!host) return request;

  let hostUrl: URL;
  let requestUrl: URL;
  try {
    hostUrl = new URL(`http://${host}`);
    requestUrl = new URL(request.url);
  } catch {
    return request;
  }

  const hostname = hostUrl.hostname.replace(/^\[|\]$/g, "");
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (!isLocalhost && !trustedDevHosts.includes(hostname)) return request;

  const forwardedHost = request.headers.get("x-forwarded-host")?.toLowerCase();
  if (forwardedHost && forwardedHost !== host) return request;

  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  const protocol = forwardedProtocol ?? requestUrl.protocol.slice(0, -1);
  if (protocol !== "http" && protocol !== "https") return request;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.protocol !== `${protocol}:` || originUrl.host !== host) {
        return request;
      }
    } catch {
      return request;
    }
  }

  if (requestUrl.host.toLowerCase() === host) return request;

  const url = new URL(
    `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
    `${protocol}://${host}`,
  );
  return new Request(url, request);
}
