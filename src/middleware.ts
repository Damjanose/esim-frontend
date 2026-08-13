import { NextRequest, NextResponse } from "next/server";
import { getPublicOrigin } from "@/lib/public-origin";
import { guardedRedirect } from "@/lib/route-guard";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const canonicalHost = "esim.uplisoft.com";
const wwwHost = `www.${canonicalHost}`;

export function middleware(request: NextRequest) {
  // `request.nextUrl` is resolved from the address the server listens on, which
  // in production is the loopback port nginx proxies to. Redirecting to it
  // would send the visitor to `localhost`, so every absolute URL below is built
  // on the public origin taken from the forwarded headers instead.
  const url = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    getPublicOrigin(request)
  );
  let shouldRedirect = false;

  if (url.hostname === wwwHost) {
    url.hostname = canonicalHost;
    url.port = "";
    shouldRedirect = true;
  }

  if (url.hostname === canonicalHost && url.protocol === "http:") {
    url.protocol = "https:";
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
