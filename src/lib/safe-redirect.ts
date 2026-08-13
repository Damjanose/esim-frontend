export const DEFAULT_REDIRECT = "/account";

/**
 * Only same-site, path-relative redirects are allowed. Anything that could send
 * the browser to another origin falls back, so `?next=` cannot be used to turn
 * our own sign-in into an open redirect.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT
): string {
  if (!value) {
    return fallback;
  }

  const candidate = value.trim();

  if (!candidate.startsWith("/")) {
    return fallback;
  }

  // "//host" and "/\host" are both treated as protocol-relative by browsers.
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }

  return candidate;
}
