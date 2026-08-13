const GUARDED_PREFIXES = ["/account", "/checkout"];

/**
 * The payment return carries its own short-lived payment cookie and must stay
 * reachable even if the session cookie has lapsed while the visitor was on Pokpay.
 */
const UNGUARDED_PATHS = ["/checkout/return"];

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
