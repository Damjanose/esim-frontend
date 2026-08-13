import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { applyCookies, readSessionTokens } from "@/lib/route-response";
import { safeNextPath } from "@/lib/safe-redirect";
import { buildClearedSessionCookies, buildSessionCookies, type SessionPair } from "@/lib/session";

/**
 * Server Components cannot write cookies, so a page that hits an expired access
 * token redirects here. This route rotates the session and sends the visitor
 * back to where they were.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  // `request.url` carries the server's bind address behind a proxy, so the
  // visitor has to be sent back to the origin they actually came from.
  const origin = getPublicOrigin(request);
  const { refreshToken } = readSessionTokens(request);

  const signIn = () =>
    applyCookies(
      NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(next)}`, origin)),
      buildClearedSessionCookies()
    );

  if (!refreshToken) {
    return signIn();
  }

  const refreshed = await backendFetch<SessionPair>("/auth/refresh", {
    method: "POST",
    body: { refreshToken }
  });

  if (!refreshed.ok) {
    return signIn();
  }

  return applyCookies(
    NextResponse.redirect(new URL(next, origin)),
    buildSessionCookies(refreshed.data)
  );
}
