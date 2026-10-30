"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/app/components/Button";
import { targetBody, type ExternalCheckoutTarget } from "@/lib/externalPayments";

/**
 * Hands the buyer to PayPal. Full-page navigation, like the Pokpay hosted flow (f021):
 * popups are unreliable in mobile and in-app browsers. PayPal returns to
 * /checkout/paypal/return, which captures and provisions.
 */
export function PaypalStep({
  target,
  signInPath,
  onStarted,
  cancelled = false
}: {
  target: ExternalCheckoutTarget;
  /** Where to resume after sign-in if the session has expired. */
  signInPath: string;
  /** For analytics: the PayPal payment that was started and what it charges. */
  onStarted?: (payment: { paymentId: string; amountCents: number; currency: string }) => void;
  /** The buyer came back from PayPal's Cancel link. */
  cancelled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/bff/payments/paypal/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetBody(target))
      });
      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent(signInPath)}`);
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { paymentId?: string; approveUrl?: string; amountCents?: number; currency?: string };
        error?: string;
      };
      if (!response.ok || !payload.data?.approveUrl || !payload.data.paymentId) {
        setError(payload.error ?? "We could not start PayPal. Please try again.");
        setBusy(false);
        return;
      }
      onStarted?.({
        paymentId: payload.data.paymentId,
        amountCents: payload.data.amountCents ?? 0,
        currency: payload.data.currency ?? "EUR"
      });
      window.location.assign(payload.data.approveUrl);
    } catch {
      setError("We could not reach PayPal. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {cancelled ? (
        <p className="rounded-[14px] bg-surfaceBright px-4 py-3 text-sm text-onSurfaceVariant">
          You cancelled at PayPal, so nothing was charged. You can try again or pick another method.
        </p>
      ) : null}
      <p className="text-sm text-onSurfaceVariant">
        You&apos;ll log in to PayPal to approve the payment, then come straight back here. Your eSIM is ready the
        moment PayPal confirms.
      </p>
      <Button className="w-full" hero loading={busy} onClick={() => void start()} size="lg" type="button">
        {busy ? null : <Wallet aria-hidden="true" size={18} />}
        Continue to PayPal
      </Button>
      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
    </div>
  );
}
