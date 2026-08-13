import { NextRequest, NextResponse } from "next/server";
import { guardedRedirect } from "@/lib/route-guard";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const canonicalHost = "esim.uplisoft.com";
const wwwHost = `www.${canonicalHost}`;

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const requestHost = request.headers.get("host")?.split(":")[0].toLowerCase();
  let shouldRedirect = false;

  if (requestHost === wwwHost || url.hostname === wwwHost) {
    url.hostname = canonicalHost;
    url.port = "";
    shouldRedirect = true;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isCanonicalHost = requestHost === canonicalHost || url.hostname === canonicalHost;
  if ((isCanonicalHost || requestHost === wwwHost) && forwardedProto === "http") {
    url.protocol = "https:";
    url.hostname = canonicalHost;
    url.port = "";
    shouldRedirect = true;
  }

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    shouldRedirect = true;
  }

  // Canonicalisation wins: redirect to the canonical URL first, then the guard
  // runs on the follow-up request so visitors are never sent to a signin URL
  // whose `next` points at a non-canonical host.
  if (shouldRedirect) {
    return NextResponse.redirect(url, 308);
  }

  const hasSession = Boolean(
    request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(REFRESH_COOKIE)?.value
  );

  const guarded = guardedRedirect(url.pathname, url.search, hasSession);
  if (guarded) {
    return NextResponse.redirect(new URL(guarded, url.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|og/).*)"]
};
