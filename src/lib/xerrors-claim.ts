/** Provisioning-claim recovery helpers for /xerrors (backend POST /admin/errors/:id/claim). */

export type ProvisioningClaim = {
  status: "pending" | "succeeded" | "failed_safe" | "unknown";
  kind: "order" | "topup";
  providerOrderId: string | null;
  attempts: number;
  lastError: string | null;
  updatedAt: string;
};

export type ClaimRequestInput =
  | { action: "attach_provider_order"; airaloOrderId: string }
  | { action: "attach_provider_result"; providerResultText: string }
  | { action: "mark_safe_to_retry"; confirmed: boolean };

export type ClaimRequestResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; message: string };

export function buildClaimRequest(input: ClaimRequestInput): ClaimRequestResult {
  if (input.action === "attach_provider_order") {
    const airaloOrderId = input.airaloOrderId.trim();
    if (!airaloOrderId) return { ok: false, message: "Enter the Airalo order id." };
    return { ok: true, body: { action: input.action, airaloOrderId } };
  }
  if (input.action === "attach_provider_result") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.providerResultText);
    } catch {
      return { ok: false, message: "Provider result is not valid JSON." };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, message: "Provider result must be a JSON object." };
    }
    return { ok: true, body: { action: input.action, providerResult: parsed } };
  }
  if (!input.confirmed) return { ok: false, message: "Confirm that you checked Airalo first." };
  return { ok: true, body: { action: input.action, confirm: "checked-airalo" } };
}

export const MARK_SAFE_MIN_AGE_MS = 5 * 60 * 1000;

type Guard = { enabled: boolean; reason?: string };

export function claimGuards(claim: ProvisioningClaim, now = Date.now()) {
  const closed = claim.status === "succeeded" ? "Claim already succeeded." : undefined;
  const failedSafe = claim.status === "failed_safe" ? "Claim is already marked safe to retry." : undefined;

  const attachOrder: Guard = closed
    ? { enabled: false, reason: closed }
    : failedSafe
      ? { enabled: false, reason: failedSafe }
      : claim.kind !== "order"
        ? { enabled: false, reason: "Only order claims take an Airalo order id." }
        : { enabled: true };

  const attachResult: Guard = closed
    ? { enabled: false, reason: closed }
    : failedSafe
      ? { enabled: false, reason: failedSafe }
      : claim.kind !== "topup"
        ? { enabled: false, reason: "Only top-up claims take a provider result." }
        : { enabled: true };

  let markSafe: Guard = { enabled: true };
  const age = now - new Date(claim.updatedAt).getTime();
  if (closed) markSafe = { enabled: false, reason: closed };
  else if (failedSafe) markSafe = { enabled: false, reason: failedSafe };
  else if (claim.providerOrderId) {
    markSafe = { enabled: false, reason: "A provider order id is attached: attach/repair instead of retrying." };
  } else if (!Number.isFinite(age) || age < MARK_SAFE_MIN_AGE_MS) {
    markSafe = { enabled: false, reason: "Updated less than 5 min ago: the first attempt may still be running." };
  }

  return {
    needsReview: claim.status === "unknown" || claim.status === "pending",
    attachOrder,
    attachResult,
    markSafe
  };
}
