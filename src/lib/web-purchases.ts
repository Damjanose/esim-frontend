/**
 * Purchases are app-only: the web is for browsing, signing in and managing
 * existing eSIMs (plus the partner area), never for paying. Every web "buy"
 * entry point lands on the package's open-in-app page instead, and the BFF
 * payment-intent routes refuse with 403 as a server-side backstop.
 */
export const WEB_PURCHASES_DISABLED_MESSAGE =
  "Purchases are available only in the eSIM2you app. Open the app to buy this plan.";

/** Where a web "buy" button for a package goes: its open-in-app page. */
export function appPurchaseHref(packageId: string) {
  return `/pkg/${encodeURIComponent(packageId)}`;
}
