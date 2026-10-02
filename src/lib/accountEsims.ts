import type { HeroPackageOption } from "@/services/packages";
import { formatMegabytes, type UsageSummary } from "./esim-install";
import { destinationBrowseHref } from "./esim-routes";
import type { OrderGroups, OrderSummary } from "./order-groups";
import type { PlanRowPlan } from "./planRow";

/**
 * Pure rules behind the My eSIMs pages (/account, /account/[orderId]). The
 * components only render what these decide, so the rules are unit-tested here.
 */

type Catalog = ReadonlyMap<string, HeroPackageOption>;

export type PackageDescription = { title: string; details: string; flagUri: string | null };

/**
 * Provider package ids (e.g. "szia-in-7days-1gb") name an operator SKU, not the
 * destination — never fit for display. When the catalog lookup misses (a
 * discontinued or rotated package), fall back to whatever duration/data figures
 * can be read out of the id rather than showing the raw slug.
 */
function detailsFromPackageId(packageId: string): string {
  const data = packageId.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
  const days = packageId.match(/(\d+)\s*days?/i);
  const parts = [
    data ? `${data[1]}${data[2]!.toUpperCase()}` : null,
    days ? `${days[1]} ${days[1] === "1" ? "day" : "days"}` : null
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Data plan";
}

export function describePackage(packageId: string, catalog: Catalog): PackageDescription {
  const option = catalog.get(packageId);
  if (option) {
    return {
      title: option.country,
      details: `${option.dataLabel} · ${option.durationLabel}`,
      flagUri: option.flagUri || null
    };
  }
  return { title: "eSIM plan", details: detailsFromPackageId(packageId), flagUri: null };
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days until `expiresAt`, rounded up so "expires in 3 hours" reads as 1 day
 * left (the app's esimTimeline.daysLeft). Null without a usable date; 0 once passed.
 */
export function daysLeft(expiresAt: string | null | undefined, now: number = Date.now()): number | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
}

export type LifecycleBadge = { label: "Active" | "Ready" | "Expired"; tone: "active" | "ready" | "expired" };

/** Straight from lifecycle_status. An unknown status reads as Ready, like groupOrdersByLifecycle. */
export function lifecycleBadge(status: string): LifecycleBadge {
  if (status === "active") return { label: "Active", tone: "active" };
  if (status === "expired") return { label: "Expired", tone: "expired" };
  return { label: "Ready", tone: "ready" };
}

/** "Active · 12 days left", "Active · Expires today", "Ready to install", "Expired". */
export function esimStatusLine(
  order: Pick<OrderSummary, "lifecycle_status" | "expires_at">,
  now: number = Date.now()
): string {
  const { label } = lifecycleBadge(order.lifecycle_status);
  if (label === "Ready") return "Ready to install";
  if (label === "Expired") return "Expired";

  const days = daysLeft(order.expires_at, now);
  if (days == null) return "Active";
  if (days === 0) return "Active · Expires today";
  return `Active · ${days} ${days === 1 ? "day" : "days"} left`;
}

/** The title's count line: "1 active · 5 total". Null when the list didn't load. */
export function esimCountLine(sections: OrderGroups | null): string | null {
  if (!sections) return null;
  const active = sections.active ? 1 : 0;
  return `${active} active · ${active + sections.ready.length + sections.history.length} total`;
}

/**
 * "Buy again" on a finished plan: the destination page of its package, but only
 * while that package is still in the catalog. No new API: the page already loads
 * the catalog to name the plans.
 */
export function buyAgainHref(packageId: string, catalog: Catalog): string | null {
  const option = catalog.get(packageId);
  return option ? destinationBrowseHref(option.countryCode) : null;
}

export type AccountPrimaryAction = { kind: "install" | "topup"; orderId: number } | null;

/**
 * The page's one gradient CTA. A paid plan that isn't installed yet blocks the
 * trip, so the newest ready plan's Install wins; with nothing to install, the
 * active plan's Top up; otherwise none (Buy again and Details stay flat).
 */
export function accountPrimaryAction(sections: OrderGroups): AccountPrimaryAction {
  const newestReady = sections.ready[0];
  if (newestReady) return { kind: "install", orderId: newestReady.id };
  if (sections.active) return { kind: "topup", orderId: sections.active.id };
  return null;
}

export type UsageMeter = {
  state: "metered" | "unlimited" | "unavailable";
  /** Share of data LEFT, 0–100: the ring / bar fill, as in the app. Null when unknown. */
  leftPercent: number | null;
  /** Large figure: "4 GB", "Unlimited". Null when usage is unavailable. */
  headline: string | null;
  /** Small line under it: "of 10 GB remaining", "No data cap". */
  caption: string | null;
  /** Why there is no figure (unavailable only). */
  note: string | null;
  /** Accessible description of the ring / bar. */
  label: string;
};

export function usageMeter(usage: UsageSummary): UsageMeter {
  if (!usage.available) {
    return { state: "unavailable", leftPercent: null, headline: null, caption: null, note: usage.message, label: usage.message };
  }
  if (usage.unlimited) {
    return { state: "unlimited", leftPercent: 100, headline: "Unlimited", caption: "No data cap", note: null, label: "Unlimited data" };
  }
  const leftPercent = Math.min(100, Math.max(0, 100 - usage.usedPercent));
  return {
    state: "metered",
    leftPercent,
    headline: usage.remainingLabel,
    caption: `of ${usage.totalLabel} remaining`,
    note: null,
    label: `${leftPercent}% of data left: ${usage.remainingLabel} of ${usage.totalLabel}`
  };
}

/** A top-up package as GET /orders/:id/topups sends it (backend toTopupPackageFromCatalog). */
export type TopupOffer = {
  id: string;
  title?: string;
  priceDisplay?: string;
  priceNumeric?: number;
  retailPrice?: number;
  hasDiscount?: boolean;
  /** Data allowance in MB. */
  amount?: number;
  /** Validity in days. */
  day?: number;
  is_unlimited?: boolean;
};

/** The catalog's unlimited sentinel (planRow UNLIMITED_DATA_GB). */
const UNLIMITED_DATA_GB = 999;

/** Shapes a top-up offer for the PlanRow pieces (data disc, tags, price). */
export function topupPlanRowPlan(offer: TopupOffer): PlanRowPlan {
  const hasAmount = typeof offer.amount === "number" && offer.amount > 0;
  return {
    id: offer.id,
    title: offer.title ?? offer.id,
    dataLabel: offer.is_unlimited ? "Unlimited" : hasAmount ? formatMegabytes(offer.amount!) : "Data top-up",
    dataNumericGb: offer.is_unlimited ? UNLIMITED_DATA_GB : hasAmount ? offer.amount! / 1024 : 0,
    durationDays: typeof offer.day === "number" ? offer.day : 0,
    durationLabel: typeof offer.day === "number" ? `${offer.day} days` : "Top-up",
    price: offer.priceDisplay ?? "",
    priceNumeric: offer.priceNumeric ?? 0,
    hasDiscount: offer.hasDiscount,
    retailPrice: offer.retailPrice
  };
}
