"use client";

import Link from "next/link";
import { LifeBuoy, ShieldCheck } from "lucide-react";
import { Button } from "@/app/components/Button";

/**
 * Shown instead of the card form once a payment has been charged but the eSIM setup
 * has not been confirmed. The Pay button is deliberately absent: paying again would
 * charge twice. Retrying calls the idempotent provision endpoint with the same id.
 */
export function RecoveryPanel({
  paymentId,
  retrying,
  error,
  onRetry,
  onStartOver
}: {
  paymentId: string;
  retrying: boolean;
  error: string | null;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  return (
    <div className="rounded-[16px] border border-brandTeal/40 bg-brandTeal/10 p-5" role="status">
      <div className="flex items-start gap-3">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-brandTeal" size={22} />
        <div className="min-w-0">
          <p className="font-bold text-brandInk">Your payment went through — do not pay again</p>
          <p className="mt-1 text-sm text-onSurfaceVariant">
            We are still setting up your eSIM. Retry below, or contact support and we will finish it for you.
          </p>
          <p className="mt-2 text-sm text-onSurfaceVariant">
            Payment reference: <span className="break-all font-mono font-bold text-brandInk">{paymentId}</span>
          </p>
          {error ? <p className="mt-2 text-sm font-semibold text-error">{error}</p> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button loading={retrying} onClick={onRetry} size="lg">
          Retry setup
        </Button>
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brandBlue hover:underline"
          href="/support"
        >
          <LifeBuoy aria-hidden="true" size={16} />
          Contact support
        </Link>
      </div>
      <button
        className="mt-4 text-xs font-semibold text-onSurfaceVariant underline"
        disabled={retrying}
        onClick={onStartOver}
        type="button"
      >
        Start a new purchase
      </button>
      <p className="mt-1 text-xs text-onSurfaceVariant">
        Your previous payment is still being set up. Only start a new purchase if you want to buy another eSIM.
      </p>
    </div>
  );
}
