"use client";

import { useState, type ReactNode } from "react";
import { LogIn } from "lucide-react";
import type { HeroPackageOption } from "@/services/packages";
import { LinkButton } from "@/app/components/Button";
import { CheckoutWizard } from "./CheckoutWizard";
import { OrderSummary } from "./OrderSummary";
import type { AppliedPromo } from "./PromoCodeField";
import { useCheckoutQuote } from "./useCheckoutQuote";

/**
 * The `plan.hasDiscount`/`retailPrice` fields describe an admin-set retail
 * discount already baked into `plan.price` — a different mechanism from a
 * partner promo code applied at checkout. When a promo is applied we trust
 * `finalCustomerPriceCents` from the backend outright (it already accounts
 * for whatever admin discount was in effect) and swap it in as the total,
 * rather than trying to recompute/stack the two client-side. The summary's
 * price lines (lib/checkoutSummary.ts) still show the admin discount above it.
 */
type CountryOption = { code: string; name: string };

/**
 * One-page checkout (spec option B). The summary comes first in the DOM, so on
 * phones its "Show order summary · €X" bar sits right under the top bar; at lg it
 * moves to the sticky right column. `children` is the server-rendered heading
 * (eyebrow, plan title, sub-copy), which leads the left column.
 */
export function CheckoutPriceSection({
  plan,
  accountEmail,
  countries,
  children
}: {
  plan: HeroPackageOption;
  accountEmail: string | null;
  countries: CountryOption[];
  children: ReactNode;
}) {
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  // Tracks whether a promo-apply request (manual, or the silent on-mount
  // re-validation of a stored code) is currently in flight. Used to both
  // gate Pay (so a payment can't be created while the promo state is
  // unsettled) and to avoid flashing the full price before a stored code's
  // discount is confirmed.
  const [promoPending, setPromoPending] = useState(false);
  // A games streak reward is applied by the backend with no code; the quote shows it.
  const quote = useCheckoutQuote({
    packageId: plan.id,
    promoCode: promo?.promoCode ?? null,
    enabled: Boolean(accountEmail) && !promoPending
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
      <OrderSummary
        className="lg:col-start-2 lg:row-start-1"
        onPromoChange={setPromo}
        onPromoPendingChange={setPromoPending}
        plan={plan}
        promo={promo}
        promoPending={promoPending}
        quotePending={quote.pending}
        streak={quote.streak}
      />

      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        {children}

        {!accountEmail ? (
          <div className="mt-6 rounded-[16px] border border-brandBlue/30 bg-brandBlue/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <LogIn aria-hidden="true" className="mt-1 shrink-0 text-brandBlue" size={20} />
              <div className="min-w-0">
                <h2 className="font-semibold text-brandInk">Sign in to complete your purchase</h2>
                <p className="mt-1 text-sm text-onSurfaceVariant">
                  Sign in or create an account to proceed with this eSIM purchase.
                </p>
                <LinkButton
                  className="mt-3"
                  href={`/signin?next=${encodeURIComponent(`/checkout?package=${plan.id}`)}`}
                  size="md"
                  variant="primary"
                >
                  Sign in to checkout
                </LinkButton>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <CheckoutWizard
            accountEmail={accountEmail}
            countries={countries}
            disabled={promoPending}
            packageId={plan.id}
            promoCode={promo?.promoCode ?? null}
          />
        </div>
      </div>
    </div>
  );
}
