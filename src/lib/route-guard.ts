// "/partners/status" is guarded but "/partners/request" deliberately isn't:
// the request page is reachable while signed out (it only requires sign-in at
// submit, so a visitor can see what partnering involves first), while the
// status page always needs a session to mean anything.
const GUARDED_PREFIXES = ["/account", "/checkout", "/profile", "/partners/status"];

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
