"use client";

import { useState } from "react";
import { discountPercentOff, formatOriginalPrice, formatPriceFromCents, hasActiveDiscount } from "@/services/discountPricing";
import type { HeroPackageOption } from "@/services/packages";
import { CheckoutWizard } from "./CheckoutWizard";
import { PromoCodeField, type AppliedPromo } from "./PromoCodeField";

/**
 * The `plan.hasDiscount`/`retailPrice` fields describe an admin-set retail
 * discount already baked into `plan.price` — a different mechanism from a
 * partner promo code applied at checkout. When a promo is applied we trust
 * `finalCustomerPriceCents` from the backend outright (it already accounts
 * for whatever admin discount was in effect) and swap it in as the total,
 * rather than trying to recompute/stack the two client-side. The admin
 * discount's strikethrough/badge still shows above it for context.
 */
type CountryOption = { code: string; name: string };

export function CheckoutPriceSection({
  plan,
  accountEmail,
  countries
}: {
  plan: HeroPackageOption;
  accountEmail: string | null;
  countries: CountryOption[];
}) {
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  // Tracks whether a promo-apply request (manual, or the silent on-mount
  // re-validation of a stored code) is currently in flight. Used to both
  // gate Pay (so a payment can't be created while the promo state is
  // unsettled) and to avoid flashing the full price before a stored code's
  // discount is confirmed.
  const [promoPending, setPromoPending] = useState(false);

  const displayPrice = promoPending
    ? null
    : promo
      ? formatPriceFromCents(plan, promo.finalCustomerPriceCents)
      : plan.price;

  return (
    <>
      <div className="mt-6 flex items-end justify-between border-t border-outline pt-6">
        <span className="text-sm text-onSurfaceVariant">Total</span>
        <span className="flex items-center gap-2.5">
          {hasActiveDiscount(plan) ? (
            <>
              {discountPercentOff(plan) != null ? (
                <span className="rounded-full bg-error/10 px-2 py-1 text-[10px] font-black text-error">
                  -{discountPercentOff(plan)}%
                </span>
              ) : null}
              <span className="text-sm font-semibold text-onSurfaceVariant line-through">
                {formatOriginalPrice(plan)}
              </span>
            </>
          ) : null}
          {promo ? (
            <span className="rounded-full bg-brandTeal/10 px-2 py-1 text-[10px] font-black text-brandTeal">
              -{promo.discountPct}%
            </span>
          ) : null}
          <span className="font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
            {displayPrice ?? (
              <span
                aria-hidden="true"
                className="inline-block h-8 w-24 animate-pulse rounded-md bg-mist align-middle"
              />
            )}
          </span>
        </span>
      </div>

      <PromoCodeField onChange={setPromo} onPendingChange={setPromoPending} packageId={plan.id} />

      <CheckoutWizard
        accountEmail={accountEmail}
        countries={countries}
        disabled={promoPending}
        packageId={plan.id}
        promoCode={promo?.promoCode ?? null}
      />
    </>
  );
}
