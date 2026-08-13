const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AccessTokenPayload = {
  email?: unknown;
  kind?: unknown;
  exp?: unknown;
};

/**
 * Reads the signed-in address out of the session access token for display.
 *
 * The backend mints `dev-auth.<base64url payload>.<hmac>` and exposes no
 * `/user/me`, so this is the only way the profile page can name the visitor.
 *
 * Display only — never an authorization decision. The signing secret lives on
 * the backend, so the signature cannot be checked here and the payload must be
 * treated as unverified. Every request that returns real data still carries the
 * token to the backend, which does verify it.
 */
export function readEmailFromAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;

  const segments = token.split(".");
  if (segments.length < 2) return null;

  let payload: AccessTokenPayload;
  try {
    const decoded = Buffer.from(segments[1], "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    payload = parsed as AccessTokenPayload;
  } catch {
    return null;
  }

  // A refresh token carries the same address but is not the active session.
  if (payload.kind !== "access") return null;

  // An expired token means the visitor is about to be bounced through refresh;
  // showing its address would name someone who is no longer signed in.
  if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  return EMAIL_PATTERN.test(email) ? email : null;
}
