"use client";

import { useCallback, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { BillingStep } from "@/app/checkout/steps/BillingStep";
import { CardStep } from "@/app/checkout/steps/CardStep";
import { Button } from "@/app/components/Button";
import { confirmTripPlanPayment, redirectToSignIn, startTripPlanCheckout } from "@/lib/tripPlan/client";
import { formatPlanPrice, summaryCta } from "@/lib/tripPlan/logic";
import type { ItineraryPrice } from "@/lib/tripPlan/types";

type CountryOption = { code: string; name: string };

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "card"; paymentId: string; environment: string }
  | { kind: "confirming"; paymentId: string }
  | { kind: "confirmFailed"; paymentId: string; message: string };

/**
 * Unlocks a preview. Free plans unlock in one call. Paid ones take the card
 * inline with the same BillingStep + CardStep as /checkout, then confirm the
 * Pokpay payment against this plan (idempotent, so "Try again" is safe).
 */
export function TripPlanUnlock({
  planId,
  price,
  accountEmail,
  countries,
  onUnlocked
}: {
  planId: string;
  price: ItineraryPrice;
  accountEmail: string | null;
  countries: CountryOption[];
  onUnlocked: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);

  const free = summaryCta(price) === "free";
  const priceLabel = formatPlanPrice(price.quoteAmount, price.quoteCurrency);

  const start = async () => {
    setError(null);
    setPhase({ kind: "starting" });
    const result = await startTripPlanCheckout(planId);

    if (!result.ok) {
      setPhase({ kind: "idle" });
      if (result.status === 401) return redirectToSignIn();
      setError(result.message || "Could not start the purchase. Try again.");
      return;
    }

    const checkout = result.data;
    if (checkout.free || checkout.alreadyPurchased) {
      onUnlocked();
      return;
    }
    if (!checkout.paymentId) {
      setPhase({ kind: "idle" });
      setError("Could not start the purchase. Try again.");
      return;
    }
    setPhase({ kind: "card", paymentId: checkout.paymentId, environment: checkout.environment ?? "staging" });
  };

  const confirm = useCallback(
    async (paymentId: string) => {
      setPhase({ kind: "confirming", paymentId });
      const result = await confirmTripPlanPayment(planId, paymentId);
      if (result.ok) {
        onUnlocked();
        return;
      }
      if (result.status === 401) return redirectToSignIn();
      setPhase({
        kind: "confirmFailed",
        paymentId,
        message:
          result.status === 402 || result.status === 409
            ? "We haven't received confirmation of your payment yet."
            : "Your payment went through, but we couldn't unlock the plan yet."
      });
    },
    [planId, onUnlocked]
  );

  return (
    <section
      aria-labelledby="trip-plan-unlock"
      className="rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
          <Lock aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-headline-md font-black text-brandInk" id="trip-plan-unlock">
            Unlock the full plan
          </h2>
          <p className="mt-1 text-body-md text-onSurfaceVariant">
            {free
              ? "This plan is free. Unlock it to see every day, refine it and download each version as a PDF."
              : "Purchase to see every day, stop and tip, refine it with your own requests and download each version as a PDF."}
          </p>
        </div>
      </div>

      {phase.kind === "idle" || phase.kind === "starting" ? (
        <Button
          className="mt-5 w-full sm:w-auto"
          disabled={phase.kind === "starting"}
          onClick={() => void start()}
          size="lg"
          type="button"
        >
          <Sparkles aria-hidden="true" size={18} />
          {phase.kind === "starting" ? "Preparing…" : free ? "Get it for free" : `Unlock for ${priceLabel}`}
        </Button>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm font-semibold text-error" role="alert">
          {error}
        </p>
      ) : null}

      {phase.kind === "card" ? (
        <div className="mt-6 space-y-6">
          <BillingStep accountEmail={accountEmail} countries={countries} onAddressReady={setBillingAddress} />
          {billingAddress ? (
            <CardStep
              billingAddress={billingAddress}
              environment={phase.environment}
              onPaid={() => void confirm(phase.paymentId)}
              paymentId={phase.paymentId}
            />
          ) : null}
          <p className="text-body-sm text-onSurfaceVariant">
            Total {priceLabel}. Payments are processed securely by Pokpay.
          </p>
        </div>
      ) : null}

      {phase.kind === "confirming" ? (
        <p className="mt-5 text-body-md font-semibold text-brandInk" role="status">
          Payment received. Unlocking your plan…
        </p>
      ) : null}

      {phase.kind === "confirmFailed" ? (
        <div className="mt-5" role="alert">
          <p className="text-sm font-semibold text-error">
            {phase.message} Try again, or contact support with your payment reference:{" "}
            <span className="font-mono font-bold">{phase.paymentId}</span>
          </p>
          <Button className="mt-3" onClick={() => void confirm(phase.paymentId)} type="button" variant="flat">
            Try again
          </Button>
        </div>
      ) : null}
    </section>
  );
}
