import {
  discountPercentOff,
  formatOriginalPrice,
  formatPriceFromCents,
  hasActiveDiscount,
  type DiscountPricedPlan,
} from "@/services/discountPricing";

/**
 * Pure rules for the checkout order summary (OrderSummary.tsx). Kept here so the
 * totals can be unit-tested without rendering.
 */

/**
 * Same shape as PromoCodeField's AppliedPromo: what the backend confirmed for a partner code.
 * `partnerFinalCents` is the price after the partner code alone; `finalCustomerPriceCents`
 * may also include a games streak reward stacked on top (absent from older responses).
 */
export type CheckoutPromo = {
  promoCode: string;
  discountPct: number;
  finalCustomerPriceCents: number;
  partnerFinalCents?: number;
};

/** An active games streak reward, priced by the backend's /payments/quote. */
export type CheckoutStreak = { discountPct: number; finalCustomerPriceCents: number };

export type CheckoutPriceLine = { kind: "plan" | "discount" | "partner" | "streak"; label: string; value: string };

/** Shown once per viewport: in section 02 below lg, in the order summary at lg+. */
export const PAYMENT_TRUST_NOTE = "Payments are handled by Pokpay — eSIM2you never sees your card details.";

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * What Pay charges, or null while a partner code or the price quote is still being
 * checked, so the full price never flashes before a discount is confirmed (f094).
 * A backend total wins outright: it already includes any admin discount, and the
 * streak reward's total also includes a partner code under it.
 */
export function checkoutTotal(
  plan: DiscountPricedPlan,
  promo: CheckoutPromo | null,
  promoPending: boolean,
  streak: CheckoutStreak | null = null,
  quotePending = false,
): string | null {
  if (promoPending || quotePending) return null;
  if (streak) return formatPriceFromCents(plan, streak.finalCustomerPriceCents);
  return promo ? formatPriceFromCents(plan, promo.finalCustomerPriceCents) : plan.price;
}

/**
 * Plan price, then each discount, so the lines step down to the total.
 * - Admin discount: a line only for a real reduction (discountPercentOff, f078).
 *   A markup (hasDiscount with a higher price) shows the charged price as the plan price.
 * - Partner code: the price before it minus the backend's partner-only total; "-N%" when that isn't a saving.
 * - Games streak reward: the price before it (after any partner code) minus the quote's total.
 */
export function checkoutPriceLines(
  plan: DiscountPricedPlan,
  promo: CheckoutPromo | null,
  streak: CheckoutStreak | null = null,
): CheckoutPriceLine[] {
  const lines: CheckoutPriceLine[] = [];
  const percentOff = discountPercentOff(plan);

  if (percentOff != null && hasActiveDiscount(plan)) {
    lines.push({ kind: "plan", label: "Plan price", value: formatOriginalPrice(plan) });
    lines.push({
      kind: "discount",
      label: `Discount -${percentOff}%`,
      value: `-${formatPriceFromCents(plan, toCents(plan.retailPrice) - toCents(plan.priceNumeric))}`,
    });
  } else {
    lines.push({ kind: "plan", label: "Plan price", value: plan.price });
  }

  let beforeStreakCents = toCents(plan.priceNumeric);
  if (promo) {
    const partnerFinalCents = promo.partnerFinalCents ?? promo.finalCustomerPriceCents;
    const savedCents = beforeStreakCents - partnerFinalCents;
    lines.push({
      kind: "partner",
      label: `Partner code -${promo.discountPct}%`,
      value: savedCents > 0 ? `-${formatPriceFromCents(plan, savedCents)}` : `-${promo.discountPct}%`,
    });
    beforeStreakCents = partnerFinalCents;
  }

  if (streak) {
    const savedCents = beforeStreakCents - streak.finalCustomerPriceCents;
    lines.push({
      kind: "streak",
      label: `Games streak reward -${streak.discountPct}%`,
      value: savedCents > 0 ? `-${formatPriceFromCents(plan, savedCents)}` : `-${streak.discountPct}%`,
    });
  }

  return lines;
}

/** The phone disclosure bar: "Show order summary · €4.00". */
export function orderSummaryToggleLabel(expanded: boolean, total: string | null): string {
  const action = expanded ? "Hide order summary" : "Show order summary";
  return total ? `${action} · ${total}` : action;
}

/**
 * The "covers N countries" disclosure is for bundles (f108). The catalog now sends
 * a one-country list for local plans too, which read "United States covers 1 countries".
 */
export function coverageCountries<T>(countries: readonly T[] | undefined): readonly T[] {
  return countries && countries.length > 1 ? countries : [];
}
