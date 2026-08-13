const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/** Private ranges used for LAN device testing, which is served over plain http. */
const PRIVATE_IP_PATTERN = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function hostname(host: string): string {
  return host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
}

function isLocal(host: string): boolean {
  const name = hostname(host);
  return LOCAL_HOSTS.has(name) || PRIVATE_IP_PATTERN.test(name) || name.endsWith(".local");
}

function buildOrigin(host: string, proto: string | null): string | null {
  const candidate = host.split(",")[0]?.trim();
  if (!candidate) {
    return null;
  }

  const scheme = proto?.split(",")[0]?.trim() || (isLocal(candidate) ? "http" : "https");

  try {
    return new URL(`${scheme}://${candidate}`).origin;
  } catch {
    return null;
  }
}

/**
 * Next resolves `request.url` from the server's bind address, not the Host
 * header, so a route handler on a deployed site sees `localhost`. Building a
 * Pokpay return_url from that would produce a URL no allowlist can accept, so
 * the public origin is derived from proxy headers instead.
 */
export function getPublicOrigin(request: Request): string {
  const configured = process.env.PUBLIC_SITE_ORIGIN?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to header detection rather than trusting a bad value.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const fromForwarded = forwardedHost ? buildOrigin(forwardedHost, forwardedProto) : null;
  if (fromForwarded) {
    return fromForwarded;
  }

  const host = request.headers.get("host");
  const fromHost = host ? buildOrigin(host, forwardedProto) : null;
  if (fromHost) {
    return fromHost;
  }

  return new URL(request.url).origin;
}
