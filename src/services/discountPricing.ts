import type { HeroPackageOption } from "./packages";

/** The currency prefix `plan.price` carries (e.g. "€"), for formatting other amounts to match. */
function pricePrefix(plan: HeroPackageOption): string {
  return plan.price.match(/^[^\d]*/)?.[0] ?? "";
}

/**
 * Renders `retailPrice` with the same currency prefix `plan.price` already
 * carries (e.g. "€") — the backend only sends the final price pre-formatted,
 * so the pre-discount amount is formatted client-side to match it exactly.
 */
export function formatOriginalPrice(plan: HeroPackageOption): string {
  return `${pricePrefix(plan)}${plan.retailPrice!.toFixed(2)}`;
}

/**
 * Renders a cents amount (e.g. `finalCustomerPriceCents` from the partner
 * promo-code endpoint) with the same currency prefix `plan.price` carries.
 */
export function formatPriceFromCents(plan: HeroPackageOption, cents: number): string {
  return `${pricePrefix(plan)}${(cents / 100).toFixed(2)}`;
}

/**
 * `-N%` savings, or `null` when there's nothing worth badging — no discount,
 * or a discount that raised the price instead of lowering it
 * (`discountDirection: 'increase'`, still `hasDiscount: true` on the
 * backend). Matches the mobile app's `formatDiscountBadge`
 * (`src/currency/formatPrice.ts`): the strikethrough original price still
 * shows via `hasActiveDiscount`/`formatOriginalPrice` regardless — only the
 * percent badge is conditional on the discount actually being a discount.
 */
export function discountPercentOff(plan: HeroPackageOption): number | null {
  if (!hasActiveDiscount(plan) || plan.retailPrice <= 0) return null;
  const pctOff = Math.round((1 - plan.priceNumeric / plan.retailPrice) * 100);
  return pctOff > 0 ? pctOff : null;
}

export function hasActiveDiscount(
  plan: HeroPackageOption,
): plan is HeroPackageOption & { hasDiscount: true; retailPrice: number } {
  return Boolean(plan.hasDiscount && plan.retailPrice != null);
}
