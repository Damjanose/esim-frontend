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

/** Same shape as PromoCodeField's AppliedPromo: what the backend confirmed for a partner code. */
export type CheckoutPromo = { promoCode: string; discountPct: number; finalCustomerPriceCents: number };

export type CheckoutPriceLine = { kind: "plan" | "discount" | "partner"; label: string; value: string };

/** Shown once per viewport: in section 02 below lg, in the order summary at lg+. */
export const PAYMENT_TRUST_NOTE = "Payments are handled by Pokpay — eSim2you never sees your card details.";

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * What Pay charges, or null while a partner code is still being checked, so the
 * full price never flashes before a stored code's discount is confirmed (f094).
 * An applied code's backend total wins outright: it already includes any admin discount.
 */
export function checkoutTotal(
  plan: DiscountPricedPlan,
  promo: CheckoutPromo | null,
  promoPending: boolean,
): string | null {
  if (promoPending) return null;
  return promo ? formatPriceFromCents(plan, promo.finalCustomerPriceCents) : plan.price;
}

/**
 * Plan price, then each discount, so the lines step down to the total.
 * - Admin discount: a line only for a real reduction (discountPercentOff, f078).
 *   A markup (hasDiscount with a higher price) shows the charged price as the plan price.
 * - Partner code: the price before it minus the backend's total; "-N%" when that isn't a saving.
 */
export function checkoutPriceLines(plan: DiscountPricedPlan, promo: CheckoutPromo | null): CheckoutPriceLine[] {
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

  if (promo) {
    const savedCents = toCents(plan.priceNumeric) - promo.finalCustomerPriceCents;
    lines.push({
      kind: "partner",
      label: `Partner code -${promo.discountPct}%`,
      value: savedCents > 0 ? `-${formatPriceFromCents(plan, savedCents)}` : `-${promo.discountPct}%`,
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
