"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { BillingStep } from "./steps/BillingStep";
import { CardStep } from "./steps/CardStep";

type CountryOption = { code: string; name: string };

export function CheckoutWizard({
  packageId,
  promoCode,
  accountEmail,
  countries,
  disabled = false
}: {
  packageId: string;
  promoCode?: string | null;
  accountEmail: string | null;
  countries: CountryOption[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string>("staging");
  const [cardError, setCardError] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

  // Creates (or re-creates) the payment intent as soon as the package/promo
  // are settled — there is no "Continue to payment" click anymore, so this
  // is the only trigger. Re-runs if promoCode changes later (e.g. the
  // shopper applies a code after the card form is already showing), since
  // the charge amount depends on it; the card step below just gets a fresh
  // paymentId when that happens.
  useEffect(() => {
    if (disabled) return;
    let cancelled = false;

    void (async () => {
      setCreatingIntent(true);
      setIntentError(null);
      try {
        const response = await fetch("/bff/payments/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            package_id: packageId,
            ...(promoCode ? { promo_code: promoCode } : {})
          })
        });

        if (response.status === 401) {
          window.location.assign(`/signin?next=${encodeURIComponent(`/checkout?package=${packageId}`)}`);
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as {
          data?: { paymentId?: string; environment?: string };
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok || !payload.data?.paymentId) {
          setIntentError(payload.error ?? "We could not start the payment. Please try again.");
          return;
        }

        setPaymentId(payload.data.paymentId);
        setEnvironment(payload.data.environment ?? "staging");
      } catch {
        if (!cancelled) setIntentError("We could not reach the payment service. Please try again.");
      } finally {
        if (!cancelled) setCreatingIntent(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packageId, promoCode, disabled]);

  const handlePaid = useCallback(async () => {
    if (!paymentId) return;
    try {
      const response = await fetch("/bff/payments/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { order?: { id: number | string } };
        error?: string;
      };

      if (!response.ok || !payload.data?.order) {
        setCardError(
          payload.error ??
            "Your payment went through, but we could not finish setting up your eSIM. Please contact support with your payment reference."
        );
        return;
      }

      // Lands on the existing, fully-built order page — same destination
      // the old hosted-redirect flow ended at (checkout/return →
      // /account/{orderId}?new=1), just reached by an internal client-side
      // navigation instead of a server redirect chain.
      router.push(`/account/${payload.data.order.id}?new=1`);
    } catch {
      setCardError(
        "Your payment went through, but we could not confirm it with our server. Please contact support with your payment reference."
      );
    }
  }, [paymentId, router]);

  return (
    <div>
      <section className="border-b border-outline/70 pb-7">
        <div className="mb-4 flex items-baseline gap-2.5">
          <span className="font-display text-[13px] font-black text-onSurfaceVariant">01</span>
          <div>
            <h2 className="text-[15px] font-bold text-brandInk">Billing address</h2>
            <p className="mt-0.5 text-xs text-onSurfaceVariant">
              Used for your receipt and card verification.
            </p>
          </div>
        </div>
        <BillingStep accountEmail={accountEmail} countries={countries} onAddressReady={setBillingAddress} />
      </section>

      <section className="pt-7">
        <div className="mb-4 flex items-baseline gap-2.5">
          <span className="font-display text-[13px] font-black text-onSurfaceVariant">02</span>
          <div>
            <h2 className="text-[15px] font-bold text-brandInk">Card details</h2>
            <p className="mt-0.5 text-xs text-onSurfaceVariant">
              Payments are handled by Pokpay — eSim2you never sees your card details.
            </p>
          </div>
        </div>

        {disabled ? (
          <p className="text-sm text-onSurfaceVariant">Finish applying your partner code first.</p>
        ) : null}
        {creatingIntent && !paymentId ? (
          <p className="text-sm text-onSurfaceVariant">Preparing secure payment…</p>
        ) : null}
        {intentError ? <p className="text-sm font-semibold text-error">{intentError}</p> : null}

        {cardError ? (
          <p className="text-sm font-semibold text-error">
            {cardError}
            <br />
            Payment reference: <span className="font-mono font-bold">{paymentId}</span>
          </p>
        ) : null}

        {paymentId && billingAddress ? (
          <CardStep
            billingAddress={billingAddress}
            environment={environment}
            onPaid={() => void handlePaid()}
            paymentId={paymentId}
          />
        ) : null}
      </section>
    </div>
  );
}
