"use client";

import { useEffect } from "react";
import { trackWebEvent } from "@/lib/analytics-events";
import { claimFailureSlot, failureEventFor } from "@/lib/analytics-events/failure";

/**
 * Sends one payment_failed event for this failed-checkout view, when the outcome is a real
 * failure. A reload of the same payment does not send it again. Renders nothing.
 */
export function FailureEvent({
  reason,
  method,
  kind,
  paymentRef
}: {
  reason: string;
  method?: string;
  kind?: string;
  /** The payment id (or reference) of this failed attempt, used to dedupe reloads. */
  paymentRef?: string;
}) {
  useEffect(() => {
    const event = failureEventFor({ reason, method, kind });
    if (!event) return;
    let storage: { getItem(key: string): string | null; setItem(key: string, value: string): void };
    try {
      storage = window.sessionStorage;
    } catch {
      storage = { getItem: () => null, setItem: () => undefined };
    }
    if (!claimFailureSlot(storage, paymentRef ?? "")) return;
    trackWebEvent({ type: "payment_failed", ...event });
  }, [reason, method, kind, paymentRef]);
  return null;
}
