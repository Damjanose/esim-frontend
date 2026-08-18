"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";

export function PayButton({ packageId }: { packageId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/bff/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: packageId })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { checkoutUrl?: string };
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign(
          `/signin?next=${encodeURIComponent(`/checkout?package=${packageId}`)}`
        );
        return;
      }

      if (!response.ok || !payload.data?.checkoutUrl) {
        setBusy(false);
        setError(payload.error ?? "We could not start the payment. Please try again.");
        return;
      }

      // Full-page navigation: popups are unreliable in mobile and in-app browsers.
      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setBusy(false);
      setError("We could not reach the payment service. Please try again.");
    }
  }

  return (
    <div className="mt-6">
      <Button
        className="w-full"
        disabled={busy}
        onClick={() => void startPayment()}
        size="lg"
        type="button"
      >
        {busy ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
        {busy ? "Opening secure checkout…" : "Pay with Pokpay"}
      </Button>

      {error ? <p className="mt-3 text-sm font-semibold text-[#ff8792]">{error}</p> : null}

      <p className="mt-3 text-center text-xs text-[#748aa2]">
        You will be redirected to Pokpay to complete your payment securely.
      </p>
    </div>
  );
}
