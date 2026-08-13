"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

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
      <button
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={busy}
        onClick={() => void startPayment()}
        type="button"
      >
        {busy ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
        {busy ? "Opening secure checkout…" : "Pay with Pokpay"}
      </button>

      {error ? <p className="mt-3 text-sm font-semibold text-[#ff8792]">{error}</p> : null}

      <p className="mt-3 text-center text-xs text-[#748aa2]">
        You will be redirected to Pokpay to complete your payment securely.
      </p>
    </div>
  );
}
