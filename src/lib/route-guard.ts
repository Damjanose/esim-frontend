const GUARDED_PREFIXES = [
  "/account",
  "/profile",
  "/partners/status",
  "/partners/request"
];

/**
 * Hosted-checkout returns carry their own short-lived payment cookie and must
 * stay reachable even if the session cookie has lapsed while the visitor was
 * on Pokpay. The goodbye page is reached with the session deliberately cleared.
 * Provisioning itself still requires a valid session at the BFF layer.
 */
/** Guarded below these, but the base path itself is public (e.g. the /trip-plan landing page). */
const GUARDED_CHILDREN_OF = ["/trip-plan"];

const UNGUARDED_PATHS = ["/account/topup/return", "/checkout/return", "/profile/deleted"];

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

  const guarded =
    GUARDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    GUARDED_CHILDREN_OF.some((base) => pathname.startsWith(`${base}/`));

  if (!guarded) {
    return null;
  }

  return `/signin?next=${encodeURIComponent(`${pathname}${search}`)}`;
}
