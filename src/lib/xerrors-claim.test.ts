import { describe, expect, it } from "vitest";
import { buildClaimRequest, claimGuards, type ProvisioningClaim } from "./xerrors-claim";

const NOW = Date.parse("2026-10-27T12:00:00Z");

function claim(overrides: Partial<ProvisioningClaim> = {}): ProvisioningClaim {
  return {
    status: "unknown",
    kind: "order",
    providerOrderId: null,
    attempts: 1,
    lastError: "timeout",
    updatedAt: "2026-10-27T11:00:00Z",
    ...overrides
  };
}

describe("buildClaimRequest", () => {
  it("builds attach_provider_order with a trimmed id and rejects an empty one", () => {
    expect(buildClaimRequest({ action: "attach_provider_order", airaloOrderId: " 12345 " })).toEqual({
      ok: true,
      body: { action: "attach_provider_order", airaloOrderId: "12345" }
    });
    const empty = buildClaimRequest({ action: "attach_provider_order", airaloOrderId: "  " });
    expect(empty.ok).toBe(false);
  });

  it("builds attach_provider_result from a JSON object and rejects bad JSON, arrays and scalars", () => {
    expect(buildClaimRequest({ action: "attach_provider_result", providerResultText: '{"id":7}' })).toEqual({
      ok: true,
      body: { action: "attach_provider_result", providerResult: { id: 7 } }
    });
    for (const text of ["", "{nope", "[1]", "5", "null"]) {
      expect(buildClaimRequest({ action: "attach_provider_result", providerResultText: text }).ok).toBe(false);
    }
  });

  it("requires the explicit confirmation for mark_safe_to_retry", () => {
    expect(buildClaimRequest({ action: "mark_safe_to_retry", confirmed: false }).ok).toBe(false);
    expect(buildClaimRequest({ action: "mark_safe_to_retry", confirmed: true })).toEqual({
      ok: true,
      body: { action: "mark_safe_to_retry", confirm: "checked-airalo" }
    });
  });
});

describe("claimGuards", () => {
  it("allows attach and mark-safe on an old unknown order claim", () => {
    const g = claimGuards(claim(), NOW);
    expect(g.attachOrder.enabled).toBe(true);
    expect(g.attachResult.enabled).toBe(false);
    expect(g.markSafe.enabled).toBe(true);
    expect(g.needsReview).toBe(true);
  });

  it("allows result attach only for topup claims", () => {
    const g = claimGuards(claim({ kind: "topup" }), NOW);
    expect(g.attachResult.enabled).toBe(true);
    expect(g.attachOrder.enabled).toBe(false);
    expect(g.attachOrder.reason).toBeTruthy();
  });

  it("disables everything once succeeded, and attach when failed_safe", () => {
    const done = claimGuards(claim({ status: "succeeded" }), NOW);
    expect([done.attachOrder, done.attachResult, done.markSafe].every((a) => !a.enabled && a.reason)).toBe(true);
    expect(done.needsReview).toBe(false);
    const safe = claimGuards(claim({ status: "failed_safe" }), NOW);
    expect(safe.attachOrder.enabled).toBe(false);
    expect(safe.markSafe.enabled).toBe(false);
  });

  it("refuses mark-safe with a supplier id or inside the 5 minute window, saying why", () => {
    const withId = claimGuards(claim({ providerOrderId: "99" }), NOW);
    expect(withId.markSafe.enabled).toBe(false);
    expect(withId.markSafe.reason).toMatch(/provider order/i);
    const fresh = claimGuards(claim({ status: "pending", updatedAt: "2026-10-27T11:57:00Z" }), NOW);
    expect(fresh.markSafe.enabled).toBe(false);
    expect(fresh.markSafe.reason).toMatch(/5 min/i);
    expect(claimGuards(claim({ status: "pending", updatedAt: "2026-10-27T11:50:00Z" }), NOW).markSafe.enabled).toBe(true);
  });
});
