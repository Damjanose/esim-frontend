import { readConsentFromDocument } from "@/lib/consent";

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-11016325088";
export const GOOGLE_ADS_PURCHASE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || "Xf_8CIug2u0cEOCP_4Qp";
/** GA4 property. Configured on the same gtag.js loader as the Ads tag (GoogleTag.tsx). */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-95H527D5BG";

/** Every catalog and checkout price is in EUR (the /esim pages and Pokpay both charge EUR). */
export const GA_CURRENCY = "EUR";

/**
 * GA4 recommended-event item, in the same shape the mobile app sends
 * (velocity-eSim src/services/analyticsLogic.ts) so web and app purchases group
 * together: item_name is country + data + duration ("Turkey 5GB 7 Days"),
 * item_category the catalog region, item_category2 the product kind.
 */
export type GaItemKind = "esim_package" | "esim_topup";

export type GaItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2: GaItemKind;
  price: number;
  quantity: number;
};

type GaItemSource = {
  id: string;
  country?: string;
  region?: string;
  dataLabel: string;
  durationLabel: string;
  priceNumeric: number;
};

/** "5 GB" -> "5GB", "Unlimited" stays, as the app's toCheckoutSummary formats it. */
function compactDataLabel(label: string): string {
  const trimmed = label.trim();
  if (/^unlimited$/i.test(trimmed)) return "Unlimited";
  const gb = trimmed.match(/^(\d+)\s*GB$/i);
  if (gb) return `${gb[1]}GB`;
  const value = trimmed.replace(/\s*GB$/i, "").trim();
  return trimmed.toLowerCase().includes("gb") ? `${value}GB` : value;
}

function joinParts(...parts: (string | undefined)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

export function gaItemName(plan: Pick<GaItemSource, "country" | "dataLabel" | "durationLabel">): string {
  return joinParts(plan.country, compactDataLabel(plan.dataLabel), plan.durationLabel.replace(/\s*Duration\s*$/i, ""));
}

export function gaItem(plan: GaItemSource, price = plan.priceNumeric): GaItem {
  return {
    item_id: plan.id,
    item_name: gaItemName(plan),
    ...(plan.region?.trim() ? { item_category: plan.region.trim() } : {}),
    item_category2: "esim_package",
    price: roundMoney(price),
    quantity: 1
  };
}

type GaTopupSource = { id: string; title?: string; amount?: number; day?: number; is_unlimited?: boolean };

/**
 * A top-up offer as the app's toTopupCheckoutSummary names it: the eSIM's
 * country + GB to one decimal ("Unlimited") + "N days", e.g. "Turkey 0.5GB 7 days".
 * Region and country come from the eSIM being topped up.
 */
export function gaTopupItem(
  offer: GaTopupSource,
  esim: { country?: string; region?: string },
  price: number
): GaItem {
  const gb = typeof offer.amount === "number" ? Math.round((offer.amount / 1024) * 10) / 10 : null;
  const data = offer.is_unlimited
    ? "Unlimited"
    : gb != null
      ? `${Number.isInteger(gb) ? gb.toFixed(0) : String(gb)}GB`
      : (offer.title ?? offer.id);
  const duration = typeof offer.day === "number" ? `${offer.day} ${offer.day === 1 ? "day" : "days"}` : undefined;
  return {
    item_id: offer.id,
    item_name: joinParts(esim.country, data, duration),
    ...(esim.region?.trim() ? { item_category: esim.region.trim() } : {}),
    item_category2: "esim_topup",
    price: roundMoney(price),
    quantity: 1
  };
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Sends a GA4 event, only with analytics consent. window.gtag also exists with
 * marketing consent alone (for the Ads tag), so its presence isn't enough;
 * callers never check consent themselves.
 */
export function trackGaEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined" || readConsentFromDocument()?.analytics !== true) return;
  window.gtag?.("event", name, { send_to: GA_ID, ...params });
}

/**
 * True the first time `key` is claimed in this browser, false after. Used so a
 * refresh or a revisited success URL never repeats a purchase. localStorage
 * outlives the tab; when storage is unavailable the event still fires once per
 * page load, which GA4 also dedupes by transaction_id.
 */
export function claimOnce(key: string): boolean {
  try {
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
  } catch {
    // Private mode or blocked storage.
  }
  return true;
}

/** Checkout stashes what Pay will charge so the success page can report the real total. */
export const PENDING_PURCHASE_KEY = "esim2you:ga-pending-purchase";

export type PendingPurchase = { packageId: string; value: number; coupon?: string };

export function writePendingPurchase(purchase: PendingPurchase): void {
  try {
    window.sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(purchase));
  } catch {
    // Storage unavailable: the success page falls back to the catalog price.
  }
}

export function readPendingPurchase(packageId: string): PendingPurchase | null {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(PENDING_PURCHASE_KEY) ?? "null") as PendingPurchase | null;
    if (parsed?.packageId !== packageId || typeof parsed.value !== "number" || !Number.isFinite(parsed.value)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * The top-up panel stashes the started payment so the ?topup=1 return can report
 * the purchase. Hosted Pokpay returns in the same tab, so sessionStorage survives.
 */
export const PENDING_TOPUP_PURCHASE_KEY = "esim2you:ga-pending-topup";

export type PendingTopupPurchase = {
  orderId: number;
  paymentId: string;
  value: number;
  currency: string;
  item: GaItem;
};

export function writePendingTopupPurchase(purchase: PendingTopupPurchase): void {
  try {
    window.sessionStorage.setItem(PENDING_TOPUP_PURCHASE_KEY, JSON.stringify(purchase));
  } catch {
    // Storage unavailable: the top-up simply goes unreported.
  }
}

/**
 * The pending top-up for this eSIM and the payment the return route provisioned,
 * removed once read so it's reported at most once. A stash for any other payment
 * (e.g. an abandoned intent) is never reported.
 */
export function takePendingTopupPurchase(orderId: number, paymentId: string): PendingTopupPurchase | null {
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(PENDING_TOPUP_PURCHASE_KEY) ?? "null"
    ) as PendingTopupPurchase | null;
    if (
      !paymentId ||
      parsed?.orderId !== orderId ||
      parsed.paymentId !== paymentId ||
      typeof parsed.value !== "number" ||
      !Number.isFinite(parsed.value) ||
      !parsed.item
    ) {
      return null;
    }
    window.sessionStorage.removeItem(PENDING_TOPUP_PURCHASE_KEY);
    return parsed;
  } catch {
    return null;
  }
}

/** utm_* and click ids the GA4 / Ads tags read from the landing URL. */
const CAMPAIGN_PARAM = /^(utm_[a-z_]+|gclid|gbraid|wbraid|fbclid)$/;

/** Copies campaign params from `from` onto `to`, so a redirect never strips attribution. */
export function carryCampaignParams(from: URLSearchParams, to: URLSearchParams): void {
  for (const [key, value] of from) {
    if (CAMPAIGN_PARAM.test(key) && !to.has(key)) to.set(key, value);
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
