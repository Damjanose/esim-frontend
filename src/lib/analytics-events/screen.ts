import { backendCountryCode } from "@/lib/esim-routes";

/**
 * Route templates for public web pages, lower case. screen.test.ts fails when a
 * public `page.tsx` has no template here, so keep this list in step with src/app.
 */
export const SCREEN_TEMPLATES = [
  "/",
  "/about",
  "/account",
  "/account/[orderid]",
  "/blog",
  "/checkout",
  "/checkout/failed",
  "/compare",
  "/compare/[slug]",
  "/contact",
  "/copy-code",
  "/destinations",
  "/esim/[slug]",
  "/esim/id/[esimid]",
  "/esim-price-index",
  "/flights",
  "/orders/[code]",
  "/partners/buy",
  "/partners/dashboard",
  "/partners/materials",
  "/partners/request",
  "/partners/status",
  "/partners/withdraw",
  "/pkg/[id]",
  "/policy",
  "/press",
  "/profile",
  "/profile/billing",
  "/profile/deleted",
  "/profile/support",
  "/signin",
  "/support",
  "/terms",
  "/travel",
  "/travel/[slug]",
  "/trip-plan",
  "/trip-plan/[id]",
  "/use-cases",
  "/use-cases/[slug]"
] as const;

function segmentsOf(path: string): string[] {
  return path.split(/[?#]/)[0].split("/").filter(Boolean);
}

/** The route template for a pathname, `/other` when unknown, or null for admin pages (never recorded). */
export function screenTemplate(pathname: string): string | null {
  const path = pathname.split(/[?#]/)[0];
  if (/^\/x[a-z]/i.test(path)) return null;
  const parts = segmentsOf(path).map((part) => part.toLowerCase());
  if (parts.length === 0) return "/";

  for (const template of SCREEN_TEMPLATES) {
    const templateParts = segmentsOf(template);
    if (templateParts.length !== parts.length) continue;
    const matches = templateParts.every((part, index) =>
      part.startsWith("[") ? parts[index].length > 0 : part === parts[index]
    );
    if (matches) return template;
  }
  return "/other";
}

/** The backend `countryCode` of a `/esim/[slug]` page, or null on any other page. */
export function destinationFromPath(pathname: string): string | null {
  const parts = segmentsOf(pathname);
  if (parts.length !== 2 || parts[0] !== "esim" || parts[1] === "id") return null;
  return backendCountryCode(parts[1].toLowerCase());
}
