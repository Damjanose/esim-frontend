import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
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
  const { refreshToken } = readSessionTokens(request);

  const signIn = () =>
    applyCookies(
      NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(next)}`, url.origin)),
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
    NextResponse.redirect(new URL(next, url.origin)),
    buildSessionCookies(refreshed.data)
  );
}
