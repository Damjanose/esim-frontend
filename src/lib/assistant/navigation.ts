import { coveredDestinationsForOption, type HeroPackageOption } from "@/services/packages";
import { destinationBrowseHref, esimSlugFromCountryQuery } from "../esim-routes";
import type { OrderSummary } from "../order-groups";
import { slugifyDestination } from "./localReplies";
import type {
  AssistantAction,
  AssistantDestination,
  AssistantFilterPayload,
  AssistantOrderSummary,
  AssistantScreen
} from "./types";

/**
 * Where each assistant action lands on the website (the app's
 * useAssistantActionHandler). Null means "no web equivalent": the chat then
 * renders no button rather than a dead one.
 */
export function assistantActionHref(
  action: AssistantAction,
  { signedIn, currentPath }: { signedIn: boolean; currentPath: string }
): string | null {
  switch (action.type) {
    case "apply_filters":
      return filtersHref(action.payload);
    case "open_country":
      return destinationBrowseHref(action.payload.slug);
    case "plan_trip": {
      const destination = action.payload?.destination?.trim();
      return destination ? `/trip-plan?destination=${encodeURIComponent(destination)}` : "/trip-plan";
    }
    case "top_up":
      return `/account/${action.payload.orderId}#top-up`;
    case "open_billing":
      return "/profile/billing";
    case "open_marketplace":
      return "/destinations";
    case "open_support":
      return signedIn ? "/profile/support" : "/support";
    case "open_esims":
      return "/account";
    case "open_profile_settings":
      return "/profile";
    case "sign_in":
      return `/signin?next=${encodeURIComponent(currentPath || "/")}`;
    case "redeem_gift":
    case "open_currency":
    case "leave_review":
      return null;
  }
}

/** Orders a from/to pair so a model that swaps them still yields a usable range. */
function range(from: number | undefined, to: number | undefined): [number | null, number | null] {
  const valid = (value: number | undefined) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  const a = valid(from);
  const b = valid(to);
  return a != null && b != null && a > b ? [b, a] : [a, b];
}

/**
 * The filter payload as the `/destinations` query the Help me choose wizard
 * already uses (`country`, `daysMin`/`daysMax`, `dataMin`/`dataMax`,
 * `unlimited`). /destinations redirects a country with a content page to
 * /esim/[slug] and keeps the rest. The website has no sort, price or free-text
 * search params, so those parts of the payload are dropped.
 */
export function filtersHref(payload: AssistantFilterPayload): string {
  const params = new URLSearchParams();
  const destination = payload.destination?.trim();
  if (destination) params.set("country", slugifyDestination(destination));

  const [daysMin, daysMax] = range(payload.durationFrom, payload.durationTo);
  if (daysMin != null) params.set("daysMin", String(daysMin));
  if (daysMax != null) params.set("daysMax", String(daysMax));

  const [dataMin, dataMax] = range(payload.dataFrom, payload.dataTo);
  if (dataMin != null && dataMin >= 999) {
    // The 999 GB sentinel means "unlimited only".
    params.set("dataMin", "999");
    params.set("unlimited", "true");
  } else {
    if (dataMin != null) params.set("dataMin", String(dataMin));
    if (dataMax != null) params.set("dataMax", String(dataMax));
    if (payload.includeUnlimited === false) params.set("unlimited", "false");
  }

  const query = params.toString();
  return query ? `/destinations?${query}` : "/destinations";
}

/**
 * Which backend screen (prompt + allowed actions) a page maps to. Guests only
 * ever get `marketplace`, which is all the backend lets them use.
 */
export function assistantScreenForPath(pathname: string, signedIn: boolean): AssistantScreen {
  if (!signedIn) return "marketplace";
  if (pathname === "/account" || pathname.startsWith("/account/")) return "esims";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "profile";
  return "marketplace";
}

/** Routes where the launcher stays out of the way: their own bottom action, or a chat of their own. */
const HIDDEN_ON = ["/checkout", "/signin", "/profile/deleted", "/profile/support"];

export function isAssistantVisible(pathname: string | null): boolean {
  if (!pathname) return true;
  // A saved trip plan carries its own bottom Pay bar; the /trip-plan landing doesn't.
  if (pathname.startsWith("/trip-plan/")) return false;
  return !HIDDEN_ON.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

/** The destination an /esim/[slug] page is about, for the "Cheapest plans for X" chip. */
export function featuredDestinationForPath(
  pathname: string,
  destinations: readonly AssistantDestination[]
): string | null {
  const match = pathname.match(/^\/esim\/([^/]+)/);
  if (!match) return null;
  const pageSlug = decodeURIComponent(match[1]);
  const found = destinations.find(
    (destination) => destination.slug === pageSlug || esimSlugFromCountryQuery(destination.slug) === pageSlug
  );
  return found?.label ?? null;
}

/** Every destination the catalog can filter by, including countries inside regional plans. */
export function toAssistantDestinations(packages: readonly HeroPackageOption[]): AssistantDestination[] {
  const bySlug = new Map<string, AssistantDestination>();
  const add = (code: string, label: string) => {
    const slug = slugifyDestination(code);
    if (slug && label.trim() && !bySlug.has(slug)) bySlug.set(slug, { slug, label: label.trim() });
  };
  for (const pkg of packages) {
    add(pkg.countryCode, pkg.country);
    if (!pkg.filters.includes("local")) {
      for (const covered of coveredDestinationsForOption(pkg)) add(covered.slug, covered.title);
    }
  }
  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Orders reduced to what the suggestions need, with a human destination name from the catalog. */
export function toAssistantOrderSummaries(
  orders: readonly OrderSummary[],
  packages: readonly HeroPackageOption[]
): AssistantOrderSummary[] {
  return orders.map((order) => ({
    id: order.id,
    destination: packages.find((pkg) => pkg.id === order.package_id)?.country.trim() || null,
    status: order.lifecycle_status,
    createdAt: order.created_at
  }));
}
