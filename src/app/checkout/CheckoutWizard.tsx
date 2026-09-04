"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BillingStep } from "./steps/BillingStep";
import { CardStep } from "./steps/CardStep";

type WizardStep = "billing" | "card";

export function CheckoutWizard({
  packageId,
  promoCode,
  accountEmail,
  disabled = false
}: {
  packageId: string;
  promoCode?: string | null;
  accountEmail: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("billing");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string>("staging");
  const [cardError, setCardError] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

  const startCardStep = useCallback(async () => {
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

      if (!response.ok || !payload.data?.paymentId) {
        setIntentError(payload.error ?? "We could not start the payment. Please try again.");
        return;
      }

      setPaymentId(payload.data.paymentId);
      setEnvironment(payload.data.environment ?? "staging");
      setStep("card");
    } catch {
      setIntentError("We could not reach the payment service. Please try again.");
    } finally {
      setCreatingIntent(false);
    }
  }, [packageId, promoCode]);

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

  if (step === "card" && paymentId) {
    return (
      <div className="mt-6">
        {cardError ? (
          <p className="mb-3 text-sm font-semibold text-error">
            {cardError}
            <br />
            Payment reference: <span className="font-mono font-bold">{paymentId}</span>
          </p>
        ) : null}
        <CardStep environment={environment} onError={setCardError} onPaid={() => void handlePaid()} paymentId={paymentId} />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <BillingStep
        accountEmail={accountEmail}
        disabled={disabled || creatingIntent}
        onContinue={() => void startCardStep()}
      />
      {creatingIntent ? <p className="mt-3 text-sm text-onSurfaceVariant">Preparing secure payment…</p> : null}
      {intentError ? <p className="mt-3 text-sm font-semibold text-error">{intentError}</p> : null}
      {disabled ? <p className="mt-3 text-sm text-onSurfaceVariant">Finish applying your promo code first.</p> : null}
    </div>
  );
}
