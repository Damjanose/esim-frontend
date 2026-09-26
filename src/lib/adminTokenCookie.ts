export const ADMIN_TOKEN_COOKIE = "velocity-admin-dashboard-token";

/**
 * Seconds until the admin token expires, read from its payload
 * (`<prefix>.<base64url JSON with exp in ms>.<signature>`). 0 when the token
 * is malformed or already expired, so the cookie is never kept past the token.
 */
export function adminTokenMaxAgeSeconds(token: string, now = Date.now()): number {
  const payload = token.split(".")[1];
  if (!payload) return 0;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(atob(base64)) as { exp?: unknown };
    if (typeof parsed.exp !== "number") return 0;
    return Math.max(0, Math.floor((parsed.exp - now) / 1000));
  } catch {
    return 0;
  }
}

/** The admin token from a `document.cookie` string, or "" when absent. */
export function readAdminTokenCookie(cookieHeader: string): string {
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_TOKEN_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return "";
}

/**
 * Cookie string that keeps the token until it expires, across tabs and browser
 * restarts. JS-readable on purpose: every admin page sends it as a Bearer header.
 */
export function adminTokenCookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  return [
    `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Strict",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function clearedAdminTokenCookie(secure: boolean): string {
  return adminTokenCookie("", 0, secure);
}
