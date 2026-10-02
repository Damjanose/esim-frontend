/**
 * Routing rules for the phone/tablet bottom dock (BottomDock.tsx), which mirrors
 * the app's BottomTabBar (velocity-eSim/src/components/bottomTabLayout.ts).
 * Pure so it can be unit-tested; the component only renders what this decides.
 */
export type DockItemId = "home" | "esims" | "destinations" | "support" | "profile";

export interface DockItem {
  id: DockItemId;
  label: string;
  href: string;
  /** The raised gradient circle in the middle of the dock (the app's Marketplace). */
  center?: boolean;
}

export const DOCK_ITEMS: readonly DockItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "esims", label: "My eSIMs", href: "/account" },
  { id: "destinations", label: "Destinations", href: "/destinations", center: true },
  { id: "support", label: "Support", href: "/support" },
  { id: "profile", label: "Profile", href: "/profile" }
];

/** Routes whose own primary action (Pay, Send code) must not share the screen bottom.
 * Admin x* pages never render Navbar (so never mount the dock); keep their paths out of this client-bundled list. */
const HIDDEN_ON: readonly string[] = ["/checkout", "/signin", "/profile/deleted"];
/** Hidden below these but not on the base page: a trip plan page carries the card Pay bar, the /trip-plan landing doesn't. */
const HIDDEN_BELOW: readonly string[] = ["/trip-plan"];

const ACTIVE_ON: ReadonlyArray<readonly [DockItemId, readonly string[]]> = [
  ["esims", ["/account"]],
  ["destinations", ["/destinations", "/esim", "/pkg"]],
  ["support", ["/support"]],
  ["profile", ["/profile"]]
];

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isDockVisible(pathname: string | null): boolean {
  if (!pathname) return true;
  if (HIDDEN_BELOW.some((base) => pathname.startsWith(`${base}/`))) return false;
  return !HIDDEN_ON.some((base) => isUnder(pathname, base));
}

export function activeDockItem(pathname: string | null): DockItemId | null {
  if (!pathname) return null;
  if (pathname === "/") return "home";
  for (const [id, bases] of ACTIVE_ON) {
    if (bases.some((base) => isUnder(pathname, base))) return id;
  }
  return null;
}
