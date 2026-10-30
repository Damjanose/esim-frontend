"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Flame, Plus } from "lucide-react";
import { topupPlanRowPlan, type TopupOffer } from "@/lib/accountEsims";
import {
  GA_CURRENCY,
  gaTopupItem,
  roundMoney,
  trackGaEvent,
  writePendingTopupPurchase
} from "@/lib/analytics";
import { availableMethods, type PaymentMethod } from "@/lib/externalPayments";
import { planDurationText, planRowTags } from "@/lib/planRow";
import { PaymentMethodPicker } from "../../checkout/PaymentMethodPicker";
import { usePaymentMethods } from "../../checkout/usePaymentMethods";
import { CryptoStep } from "../../checkout/steps/CryptoStep";
import { GaEvent } from "../../GaEvent";
import { Button } from "../../components/Button";
import { PlanDataDisc, PlanPrice, PlanTags } from "../../components/PlanRow";

export type TopupPackage = TopupOffer;

/**
 * "Add more data": the backend's top-up offers as PlanRow-style rows (data disc,
 * days, tags, price). Card is a hosted Pokpay redirect (f019); PayPal redirects to
 * PayPal and returns via /checkout/paypal/return; crypto opens an inline USDT invoice.
 * Every Top up is flat; the page's gradient, if any, is the usage card's Top up.
 */
export function TopUpPanel({
  orderId,
  packages,
  esim
}: {
  orderId: number;
  packages: TopupPackage[];
  /** The topped-up eSIM's catalog country and region, for the GA4 top-up item. */
  esim: { country?: string; region?: string };
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streakPct = useStreakRewardPct(orderId, packages[0]?.id ?? null);
  const paymentMethods = usePaymentMethods();
  const methods = availableMethods(paymentMethods);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const selectedMethod = methods.includes(method) ? method : "card";
  const [cryptoPackageId, setCryptoPackageId] = useState<string | null>(null);

  // Back from PayPal's Cancel link: reopen PayPal and say nothing was charged.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("paypal") === "cancelled") {
      setMethod("paypal");
      setError("You cancelled at PayPal, so nothing was charged. Pick a top-up to try again.");
    }
  }, []);
  // A list of offers beside the eSIM, so view_item_list: view_item would count every
  // usage check as a product view, unlike the app (one top-up screen opened).
  const viewItemList = useMemo(
    () => ({
      item_list_id: "topup_offers",
      item_list_name: "Top-up offers",
      items: packages.map((pkg) => gaTopupItem(pkg, esim, pkg.priceNumeric ?? 0))
    }),
    [esim, packages]
  );

  /** Stashes what will be charged so ?topup=1 can report the GA4 purchase for this payment. */
  function stashPendingPurchase(packageId: string, paymentId: string | undefined, amount: number | undefined, currency?: string) {
    const offer = packages.find((pkg) => pkg.id === packageId);
    if (!offer || !paymentId || typeof amount !== "number" || amount <= 0) return;
    const pending = {
      orderId,
      paymentId,
      value: roundMoney(amount),
      currency: currency?.trim().toUpperCase() || GA_CURRENCY,
      item: gaTopupItem(offer, esim, amount)
    };
    writePendingTopupPurchase(pending);
    trackGaEvent("begin_checkout", { currency: pending.currency, value: pending.value, items: [pending.item] });
  }

  async function startPaypalTopup(packageId: string) {
    setPendingId(packageId);
    setError(null);
    try {
      const response = await fetch("/bff/payments/paypal/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, package_id: packageId })
      });
      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent(`/account/${orderId}`)}`);
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { approveUrl?: string; paymentId?: string; amountCents?: number; currency?: string };
        error?: string;
      };
      if (!response.ok || !payload.data?.approveUrl) {
        setPendingId(null);
        setError(payload.error ?? "We could not start PayPal. Please try again.");
        return;
      }
      const { paymentId, amountCents, currency } = payload.data;
      stashPendingPurchase(packageId, paymentId, amountCents != null ? amountCents / 100 : undefined, currency);
      window.location.assign(payload.data.approveUrl);
    } catch {
      setPendingId(null);
      setError("We could not reach PayPal. Please try again.");
    }
  }

  function chooseTopup(packageId: string) {
    if (selectedMethod === "paypal") {
      void startPaypalTopup(packageId);
    } else if (selectedMethod === "crypto") {
      setError(null);
      setCryptoPackageId(packageId);
    } else {
      void startTopup(packageId);
    }
  }

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
        data?: { checkoutUrl?: string; paymentId?: string; amount?: number; currency?: string };
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

      // What Pokpay will charge (streak reward included), for the ?topup=1 purchase event.
      const offer = packages.find((pkg) => pkg.id === packageId);
      const { paymentId, amount, currency } = payload.data;
      if (offer && paymentId && typeof amount === "number" && amount > 0) {
        const pending = {
          orderId,
          paymentId,
          value: roundMoney(amount),
          currency: currency?.trim().toUpperCase() || GA_CURRENCY,
          item: gaTopupItem(offer, esim, amount)
        };
        writePendingTopupPurchase(pending);
        // Card details go in on Pokpay's hosted page, which the site can't observe, so
        // there's no add_payment_info here; begin_checkout marks the hand-off instead.
        trackGaEvent("begin_checkout", { currency: pending.currency, value: pending.value, items: [pending.item] });
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
      <GaEvent name="view_item_list" params={viewItemList} />
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <Plus aria-hidden="true" className="text-brandBlue" size={20} />
        Add more data
      </h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">
        Top up this eSIM without installing a new one.
      </p>

      <div className="mt-5">
        <PaymentMethodPicker
          disabled={pendingId !== null || cryptoPackageId !== null}
          methods={methods}
          onChange={setMethod}
          value={selectedMethod}
        />
      </div>

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
                  disabled={pendingId !== null || cryptoPackageId !== null}
                  loading={busy}
                  onClick={() => chooseTopup(pkg.id)}
                  type="button"
                  variant="tint"
                >
                  {busy ? null : <CreditCard aria-hidden="true" size={16} />}
                  Top up
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {cryptoPackageId ? (
        <div className="mt-5 border-t border-outline/50 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-display text-sm font-black text-brandInk">Pay with USDT</p>
            <button
              className="text-sm font-bold text-brandBlue underline-offset-4 hover:underline"
              onClick={() => setCryptoPackageId(null)}
              type="button"
            >
              Choose another top-up
            </button>
          </div>
          <CryptoStep
            networks={paymentMethods.cryptoNetworks}
            onStarted={(payment) =>
              stashPendingPurchase(cryptoPackageId, payment.paymentId, payment.amountCents / 100, payment.currency)
            }
            // The success URL is this same page, so the panel stays mounted: close the invoice.
            onSettled={() => setCryptoPackageId(null)}
            signInPath={`/account/${orderId}`}
            target={{ kind: "topup", orderId, packageId: cryptoPackageId }}
          />
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}

      <p className="mt-4 text-xs text-onSurfaceVariant">
        {selectedMethod === "paypal"
          ? "You will be redirected to PayPal to approve the payment."
          : selectedMethod === "crypto"
            ? "Pick a top-up to get a USDT payment address."
            : "You will be redirected to Pokpay to complete your payment securely."}
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
