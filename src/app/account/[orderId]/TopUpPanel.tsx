"use client";

import { useEffect, useState } from "react";
import { CreditCard, Flame, Loader2, Plus } from "lucide-react";
import { topupPlanRowPlan, type TopupOffer } from "@/lib/accountEsims";
import { planDurationText, planRowTags } from "@/lib/planRow";
import { Button } from "../../components/Button";
import { PlanDataDisc, PlanPrice, PlanTags } from "../../components/PlanRow";

export type TopupPackage = TopupOffer;

/**
 * "Add more data": the backend's top-up offers as PlanRow-style rows (data disc,
 * days, tags, price). Payment is unchanged: a hosted Pokpay redirect (f019).
 * Every Top up is flat; the page's gradient, if any, is the usage card's Top up.
 */
export function TopUpPanel({
  orderId,
  packages
}: {
  orderId: number;
  packages: TopupPackage[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streakPct = useStreakRewardPct(orderId, packages[0]?.id ?? null);

  async function startTopup(packageId: string) {
    setPendingId(packageId);
    setError(null);

    try {
      const response = await fetch("/bff/payments/topups/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, package_id: packageId })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { checkoutUrl?: string };
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent(`/account/${orderId}`)}`);
        return;
      }

      if (!response.ok || !payload.data?.checkoutUrl) {
        setPendingId(null);
        setError(payload.error ?? "We could not start the top-up. Please try again.");
        return;
      }

      // Full-page navigation: popups are unreliable in mobile and in-app browsers.
      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setPendingId(null);
      setError("We could not reach the payment service. Please try again.");
    }
  }

  return (
    <section
      className="mt-4 scroll-mt-6 rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6"
      id="top-up"
    >
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <Plus aria-hidden="true" className="text-brandBlue" size={20} />
        Add more data
      </h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">
        Top up this eSIM without installing a new one.
      </p>

      {streakPct ? (
        <p className="mt-3 flex items-center gap-2 rounded-[12px] bg-brandBlue/10 px-3 py-2 text-sm font-semibold text-brandBlue">
          <Flame aria-hidden="true" className="shrink-0" size={16} />
          Your games streak reward takes {streakPct}% off one top-up at payment.
        </p>
      ) : null}

      <ul className="mt-5 space-y-3">
        {packages.map((pkg) => {
          const plan = topupPlanRowPlan(pkg);
          const busy = pendingId === pkg.id;

          return (
            <li
              className="flex flex-wrap items-center gap-3 rounded-[18px] border border-outline/70 bg-surface p-3 sm:flex-nowrap sm:gap-4 sm:p-4"
              key={pkg.id}
            >
              <PlanDataDisc plan={plan} />

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-title-sm font-black text-brandInk sm:text-lg">
                  {planDurationText(plan)}
                </h3>
                <p className="mt-0.5 truncate text-body-sm font-semibold text-onSurface">{plan.title}</p>
                <PlanTags className="mt-1" tags={planRowTags(plan, { position: null })} />
              </div>

              {/* Phones: price and Top up drop to their own line, like PlanRow. */}
              <div className="flex w-full items-center justify-between gap-2 border-t border-outline/50 pt-3 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                <PlanPrice plan={plan} />
                <Button
                  aria-label={`Top up: ${plan.title}`}
                  className="whitespace-nowrap"
                  disabled={pendingId !== null}
                  onClick={() => void startTopup(pkg.id)}
                  type="button"
                  variant="flat"
                >
                  {busy ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                  ) : (
                    <CreditCard aria-hidden="true" size={16} />
                  )}
                  Top up
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}

      <p className="mt-4 text-xs text-onSurfaceVariant">
        You will be redirected to Pokpay to complete your payment securely.
      </p>
    </section>
  );
}

/**
 * The games streak reward % the backend would take off a top-up right now, or null.
 * One quote is enough: the reward is a flat % on whichever offer is bought.
 */
function useStreakRewardPct(orderId: number, packageId: string | null): number | null {
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    if (!packageId) return;
    let cancelled = false;
    void fetch("/bff/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, orderId })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { data?: { streakDiscountPct?: number | null } } | null) => {
        const value = payload?.data?.streakDiscountPct;
        if (!cancelled) setPct(typeof value === "number" && value > 0 ? value : null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [orderId, packageId]);

  return pct;
}
