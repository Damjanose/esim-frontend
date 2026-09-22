"use client";

import { useEffect, useRef, useState } from "react";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { BillingStep } from "./steps/BillingStep";

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
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  // Guards against a second assign if React re-renders after billing + URL are both ready.
  const redirectedRef = useRef(false);

  // Creates (or re-creates) the payment intent as soon as the package/promo
  // are settled. Re-runs if promoCode changes later (e.g. the shopper applies
  // a code after billing is already saved), since the charge amount depends on it.
  useEffect(() => {
    if (disabled) return;
    let cancelled = false;
    redirectedRef.current = false;
    setCheckoutUrl(null);
    setRedirecting(false);

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
          data?: { paymentId?: string; checkoutUrl?: string };
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok || !payload.data?.checkoutUrl) {
          setIntentError(payload.error ?? "We could not start the payment. Please try again.");
          return;
        }

        setCheckoutUrl(payload.data.checkoutUrl);
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

  // Once billing is on file and Pokpay gave us a hosted URL, leave this site —
  // the card is entered on Pokpay, never on eSim2you.
  useEffect(() => {
    if (disabled || !billingAddress || !checkoutUrl || redirectedRef.current) return;
    redirectedRef.current = true;
    setRedirecting(true);
    window.location.assign(checkoutUrl);
  }, [billingAddress, checkoutUrl, disabled]);

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
            <h2 className="text-[15px] font-bold text-brandInk">Payment</h2>
            <p className="mt-0.5 text-xs text-onSurfaceVariant">
              You will enter your card on Pokpay&apos;s secure payment page.
            </p>
          </div>
        </div>

        {disabled ? (
          <p className="text-sm text-onSurfaceVariant">Finish applying your partner code first.</p>
        ) : null}
        {creatingIntent && !checkoutUrl ? (
          <p className="text-sm text-onSurfaceVariant">Preparing secure payment…</p>
        ) : null}
        {intentError ? <p className="text-sm font-semibold text-error">{intentError}</p> : null}
        {redirecting ? (
          <p className="text-sm text-onSurfaceVariant">Taking you to Pokpay to pay…</p>
        ) : null}
        {!disabled && billingAddress && !checkoutUrl && !creatingIntent && !intentError ? (
          <p className="text-sm text-onSurfaceVariant">Waiting for payment session…</p>
        ) : null}
      </section>
    </div>
  );
}
