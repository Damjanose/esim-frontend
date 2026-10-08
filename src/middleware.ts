import { NextRequest, NextResponse } from "next/server";
import { esimPathForCountryQuery } from "@/lib/esim-routes";
import { getPublicOrigin } from "@/lib/public-origin";
import { isNoindexPath, noindexHeaderValue } from "@/lib/robots-policy";
import { guardedRedirect } from "@/lib/route-guard";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const canonicalHost = "esim.uplisoft.com";
const wwwHost = `www.${canonicalHost}`;

// Public content slugs are lowercase; /esim/Japan should land on /esim/japan
// instead of a 404. /esim/id/<esimId> is a private id and keeps its case.
const lowercaseSlugPath = /^\/(esim|travel|use-cases|compare)\/(?!id\/)[^/]+$/;

function withNoindex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", noindexHeaderValue);
  return response;
}

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

  if (lowercaseSlugPath.test(url.pathname) && url.pathname !== url.pathname.toLowerCase()) {
    url.pathname = url.pathname.toLowerCase();
    shouldRedirect = true;
  }

  // /destinations?country=<slug> → /esim/<slug> when that page exists. Done
  // here rather than in the page: destinations/loading.tsx streams the page,
  // which turns a page-level permanentRedirect into a 200 + meta refresh.
  // Countries without an /esim page keep the live plan view (noindex below).
  let unknownCountryView = false;
  const country = url.pathname === "/destinations" ? url.searchParams.get("country") : null;
  if (country !== null && country.trim()) {
    const esimPath = esimPathForCountryQuery(country);
    if (esimPath) {
      url.pathname = esimPath;
      url.searchParams.delete("country");
      shouldRedirect = true;
    } else {
      unknownCountryView = true;
    }
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

  const noindex = unknownCountryView || isNoindexPath(url.pathname);

  const guarded = guardedRedirect(url.pathname, url.search, hasSession);
  if (guarded) {
    const response = NextResponse.redirect(new URL(guarded, url.origin));
    return noindex ? withNoindex(response) : response;
  }

  return noindex ? withNoindex(NextResponse.next()) : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og/|bff/|images/|lottie/|manifest\\.json|logo-icon\\.png|app-logo\\.png).*)"
  ]
};
