import { PAYMENT_METHODS, type FailureCode, type PaymentMethod } from "./contract";

const CODE_BY_REASON: Record<string, FailureCode> = {
  unpaid: "declined",
  declined: "declined",
  cancelled: "cancelled",
  cancel: "cancelled",
  timeout: "timeout",
  network: "network",
  signin: "auth_failed",
  missing_payment: "validation",
  unconfirmed: "provider_error",
  provisioning: "provider_error",
  setting_up: "provider_error",
  pending: "other",
  refunded: "other",
  review: "other"
};

/** Maps one of our own failure reasons to a FAILURE_CODES value. Never passes a provider message through. */
export function failureCodeFromReason(reason: string | null | undefined): FailureCode {
  if (!reason) return "other";
  return CODE_BY_REASON[reason] ?? "other";
}

/** Outcomes that are not a payment failure: the eSIM is still being set up, or the money is being handled. */
const NOT_A_FAILURE = new Set(["setting_up", "pending", "review", "refunded", "signin"]);

/**
 * The payment_failed event for one failed-checkout page view, or null when this outcome
 * must not count (not a failure, or a wallet top-up or partner payment).
 */
export function failureEventFor(input: { reason: string; method?: string | null; kind?: string | null }):
  | { paymentMethod: PaymentMethod; failureCode: FailureCode }
  | null {
  if (input.kind === "wallet") return null;
  if (NOT_A_FAILURE.has(input.reason)) return null;
  const paymentMethod = (PAYMENT_METHODS as readonly string[]).includes(input.method ?? "")
    ? (input.method as PaymentMethod)
    : "other";
  return { paymentMethod, failureCode: failureCodeFromReason(input.reason) };
}

/**
 * Claims the payment for this browser session, so a reload of the failed page does not
 * send the event again. Without a payment reference nothing can be deduplicated.
 */
export function claimFailureSlot(storage: { getItem(key: string): string | null; setItem(key: string, value: string): void }, paymentRef: string): boolean {
  if (!paymentRef) return true;
  const key = `esim2you_failure_sent:${paymentRef}`;
  try {
    if (storage.getItem(key)) return false;
    storage.setItem(key, "1");
  } catch {
    // Blocked storage: send once rather than never.
  }
  return true;
}
