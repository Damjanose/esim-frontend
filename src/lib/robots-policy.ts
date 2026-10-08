/**
 * Crawl policy shared by robots.txt and middleware. Kept free of content
 * imports so the middleware bundle stays small.
 *
 * One mechanism per route: endpoints that never render HTML are blocked in
 * robots.txt; HTML routes are left crawlable and answer with noindex (meta tag
 * plus X-Robots-Tag), because Google cannot read a noindex on a URL it is not
 * allowed to fetch.
 */

/** Non-HTML endpoints, plus Cloudflare's email-protection links. */
export const robotsDisallowPaths = ["/api", "/admin", "/auth", "/bff", "/cdn-cgi/"] as const;

/**
 * HTML routes that render a noindex page or bounce anonymous visitors to
 * /signin. /billing and /dashboard have no page and 404, but stay listed so a
 * future page there starts out private.
 */
export const noindexRoutePrefixes = [
  "/account",
  "/billing",
  "/checkout",
  "/dashboard",
  "/esim/id",
  "/partners",
  "/pkg",
  "/profile",
  "/signin"
] as const;

/** Private below this base, but the base itself is a public page. */
const noindexChildrenOf = ["/trip-plan"] as const;

export const noindexHeaderValue = "noindex, nofollow";

export function isNoindexPath(pathname: string): boolean {
  return (
    noindexRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    noindexChildrenOf.some((base) => pathname.startsWith(`${base}/`))
  );
}

/**
 * `rel` for a link into a private or noindex route. Crawlers otherwise
 * discover every /checkout?package= and /signin?next= URL from the plan CTAs.
 * Unknown-country /destinations?country= views are noindex too.
 */
export function crawlRel(href: string): "nofollow" | undefined {
  const [pathname, search = ""] = href.split("?");
  if (isNoindexPath(pathname)) return "nofollow";
  if (pathname === "/destinations" && new URLSearchParams(search).has("country")) return "nofollow";
  return undefined;
}
