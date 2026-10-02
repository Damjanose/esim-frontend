/**
 * Navbar tone rules. The fixed capsule navbar is dark glass while the
 * homepage's dark hero card (marked `data-nav-dark`) is still under it, and
 * light glass everywhere else. Pure so it can be unit-tested; NavbarTone.tsx
 * only measures and applies what this decides.
 */
export type NavTone = "dark" | "light";

/** Capsule bottom edge: 12px top padding + 64px bar at lg (56px below), plus a little slack. */
export const NAV_CLEARANCE_PX = 80;

/** `heroBottom` is the dark hero card's viewport bottom, or null when the page has none. */
export function navToneFor(heroBottom: number | null): NavTone {
  return heroBottom !== null && heroBottom > NAV_CLEARANCE_PX ? "dark" : "light";
}

/** First paint, before anything is measured: only the homepage opens on a dark hero. */
export function initialNavTone(pathname: string | null): NavTone {
  return pathname === "/" ? "dark" : "light";
}

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Country plan pages (/esim, /pkg) belong to Destinations, as in the bottom dock. */
const EXTRA_ACTIVE_ON: Record<string, readonly string[]> = {
  "/destinations": ["/esim", "/pkg"]
};

export function isNavLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return [href, ...(EXTRA_ACTIVE_ON[href] ?? [])].some((base) => isUnder(pathname, base));
}
