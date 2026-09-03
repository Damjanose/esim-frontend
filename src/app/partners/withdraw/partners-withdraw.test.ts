import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const withdrawPage = readFileSync("src/app/partners/withdraw/page.tsx", "utf8");
const withdrawForm = readFileSync("src/app/partners/withdraw/WithdrawForm.tsx", "utf8");
const verificationForm = readFileSync("src/app/partners/withdraw/VerificationForm.tsx", "utf8");
const payoutHistory = readFileSync("src/app/partners/withdraw/PayoutHistory.tsx", "utf8");

describe("partner withdraw page", () => {
  it("renders inside the shared public shell", () => {
    expect(withdrawPage).toContain("<Navbar />");
    expect(withdrawPage).toContain("<SiteFooter />");
  });

  it("is excluded from search indexing, like the other signed-in account pages", () => {
    expect(withdrawPage).toContain("indexable: false");
  });

  it("loads both the partner record and payout history through fetchForPage", () => {
    expect(withdrawPage).toContain('fetchForPage<Partner>("/partners/me", "/partners/withdraw")');
    expect(withdrawPage).toContain(
      'fetchForPage<{ payouts: PartnerPayoutSummary[] }>(\n      "/partners/me/payouts",'
    );
  });

  it("prompts to apply instead of showing an error when no partner record exists", () => {
    expect(withdrawPage).toContain("partnerResult.status === 404");
    expect(withdrawPage).toContain('href="/partners/request"');
  });

  it("blocks Suspended/Cancelled partners from withdrawing", () => {
    expect(withdrawPage).toContain("BLOCKED_STATUSES");
    expect(withdrawPage).toContain('new Set(["Suspended", "Cancelled"])');
  });

  it("shows the verification form only when status is VerificationRequired", () => {
    expect(withdrawPage).toContain('partnerResult.data.status === "VerificationRequired"');
    expect(withdrawPage).toContain("<VerificationForm />");
  });

  it("always renders the withdrawal form and payout history for a non-blocked partner", () => {
    expect(withdrawPage).toContain("<WithdrawForm commissionBalanceCents={partnerResult.data.commissionBalanceCents} />");
    expect(withdrawPage).toContain("<PayoutHistory");
  });
});

describe("WithdrawForm", () => {
  it("is a client component", () => {
    expect(withdrawForm).toContain('"use client"');
  });

  it("enforces the €50 minimum client-side, mirroring the backend's MINIMUM_WITHDRAWAL_CENTS", () => {
    expect(withdrawForm).toContain("MINIMUM_WITHDRAWAL_CENTS = 5000");
    expect(withdrawForm).toContain("belowMinimum");
  });

  it("collects only a PayPal email — the backend claims the whole commission balance, no amount field", () => {
    expect(withdrawForm).toContain('type="email"');
    expect(withdrawForm).not.toContain("amountCents");
  });

  it("submits to the withdraw BFF route with payoutEmail", () => {
    expect(withdrawForm).toContain('"/bff/partners/me/withdraw"');
    expect(withdrawForm).toContain("payoutEmail");
  });

  it("redirects to sign-in on an expired/missing session", () => {
    expect(withdrawForm).toContain("response.status === 401");
    expect(withdrawForm).toContain('window.location.assign(`/signin?next=');
  });
});

describe("VerificationForm", () => {
  it("is a client component", () => {
    expect(verificationForm).toContain('"use client"');
  });

  it("submits free-text details to the verification BFF route", () => {
    expect(verificationForm).toContain('"/bff/partners/me/verification"');
    expect(verificationForm).toContain('method: "POST"');
  });

  it("keeps the field simple/free-text rather than a structured shape, matching the backend's unstructured v1", () => {
    expect(verificationForm).toContain("<textarea");
  });

  it("redirects to sign-in on an expired/missing session", () => {
    expect(verificationForm).toContain("response.status === 401");
  });
});

describe("PayoutHistory", () => {
  it("renders the payout fields returned by GET /partners/me/payouts", () => {
    for (const field of ["id", "amountCents", "status", "requestedAt", "paidAt", "failedAt", "failureReason"]) {
      expect(payoutHistory).toContain(field);
    }
  });

  it("omits payoutEmail, matching the backend projection that deliberately excludes it", () => {
    expect(payoutHistory).not.toContain("payoutEmail");
  });

  it("shows an empty state when there are no payouts yet", () => {
    expect(payoutHistory).toContain("No withdrawals yet");
  });
});
