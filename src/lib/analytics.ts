import { readConsentFromDocument } from "@/lib/consent";

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-11016325088";
export const GOOGLE_ADS_PURCHASE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || "Xf_8CIug2u0cEOCP_4Qp";
/** GA4 property. Configured on the same gtag.js loader as the Ads tag (GoogleTag.tsx). */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-95H527D5BG";

/** Every catalog and checkout price is in EUR (the /esim pages and Pokpay both charge EUR). */
export const GA_CURRENCY = "EUR";

/** GA4 recommended-event item. item_name is the plan title; item_category the country/region. */
export type GaItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
};

type GaItemSource = { id: string; title: string; country?: string; priceNumeric: number };

export function gaItem(plan: GaItemSource, price = plan.priceNumeric): GaItem {
  return {
    item_id: plan.id,
    item_name: plan.country ? `${plan.country} · ${plan.title}` : plan.title,
    ...(plan.country ? { item_category: plan.country } : {}),
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
