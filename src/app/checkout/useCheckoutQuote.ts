"use client";

import { useEffect, useState } from "react";
import type { CheckoutStreak } from "@/lib/checkoutSummary";

type QuotePayload = {
  data?: { streakDiscountPct?: number | null; finalCustomerPriceCents?: number };
};

/**
 * Asks the backend what /payments/intent would charge, to show an active games streak
 * reward (it is applied server-side to the user's next plan or top-up, no code needed).
 * Re-quotes when the partner code changes, since the reward stacks on top of it. Any
 * failure just means no streak line: the charge itself is always priced by the backend.
 */
export function useCheckoutQuote({
  packageId,
  promoCode,
  enabled
}: {
  packageId: string;
  promoCode: string | null;
  /** Signed in and no partner-code check in flight. */
  enabled: boolean;
}): { streak: CheckoutStreak | null; pending: boolean } {
  const [streak, setStreak] = useState<CheckoutStreak | null>(null);
  const [pending, setPending] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setPending(false);
      return;
    }

    let cancelled = false;
    setPending(true);

    void (async () => {
      try {
        const response = await fetch("/bff/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId, ...(promoCode ? { promoCode } : {}) })
        });
        const payload = (await response.json().catch(() => ({}))) as QuotePayload;
        const pct = payload.data?.streakDiscountPct;
        const final = payload.data?.finalCustomerPriceCents;
        if (cancelled) return;
        setStreak(
          response.ok && typeof pct === "number" && pct > 0 && typeof final === "number"
            ? { discountPct: pct, finalCustomerPriceCents: final }
            : null
        );
      } catch {
        if (!cancelled) setStreak(null);
      } finally {
        if (!cancelled) setPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packageId, promoCode, enabled]);

  return { streak, pending };
}
