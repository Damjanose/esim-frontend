const GUARDED_PREFIXES = [
  "/account",
  "/checkout",
  "/profile",
  "/partners/status",
  "/partners/request"
];

/**
 * The payment returns carry their own short-lived payment cookie and must stay
 * reachable even if the session cookie has lapsed while the visitor was on
 * Pokpay. The goodbye page is reached with the session deliberately cleared.
 */
const UNGUARDED_PATHS = ["/checkout/return", "/account/topup/return", "/profile/deleted"];

/**
 * Presence of a session cookie is all middleware can cheaply check. It is a
 * routing convenience, not an authorization decision — every backend call is
 * still validated server-side.
 */
export function guardedRedirect(
  pathname: string,
  search: string,
  hasSession: boolean
): string | null {
  if (hasSession) {
    return null;
  }

  if (UNGUARDED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  const guarded = GUARDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!guarded) {
    return null;
  }

  return `/signin?next=${encodeURIComponent(`${pathname}${search}`)}`;
}
