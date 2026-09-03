import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardPage = readFileSync("src/app/partners/dashboard/page.tsx", "utf8");
const qrCodeCard = readFileSync("src/app/partners/dashboard/QrCodeCard.tsx", "utf8");

describe("partner dashboard page", () => {
  it("renders inside the shared public shell", () => {
    expect(dashboardPage).toContain("<Navbar />");
    expect(dashboardPage).toContain("<SiteFooter />");
  });

  it("is excluded from search indexing, like the other signed-in account pages", () => {
    expect(dashboardPage).toContain("indexable: false");
  });

  it("loads the dashboard through fetchForPage, which redirects through sign-in on an expired session", () => {
    expect(dashboardPage).toContain(
      'fetchForPage<Dashboard>("/partners/me/dashboard", "/partners/dashboard")'
    );
  });

  it("prompts to apply instead of showing an error when no partner record exists", () => {
    expect(dashboardPage).toContain("result.status === 404");
    expect(dashboardPage).toContain('href="/partners/request"');
  });

  it("sends non-dashboard-worthy statuses back to the status page instead of showing empty stats", () => {
    expect(dashboardPage).toContain("DASHBOARD_STATUSES");
    expect(dashboardPage).toContain('new Set(["Pending", "Active"])');
    expect(dashboardPage).toContain('href="/partners/status"');
  });

  it.each(["PendingApproval", "VerificationRequired", "Suspended", "Cancelled"])(
    "excludes %s from the dashboard-worthy status set, unlike Pending/Active",
    (status) => {
      // Regression guard: DASHBOARD_STATUSES must name Pending/Active
      // explicitly rather than everything-but-a-blocklist, so a status this
      // set was never meant to include can't silently start rendering full
      // dashboard stats just because someone widened the set string without
      // reviewing which statuses that affects.
      const setLiteralMatch = dashboardPage.match(/DASHBOARD_STATUSES\s*=\s*new Set\(\[([^\]]*)\]\)/);
      expect(setLiteralMatch).not.toBeNull();
      const members = setLiteralMatch![1];
      expect(members).not.toContain(status);
    }
  );

  it("builds the referral link from the promo code and the public origin, not a hardcoded domain", () => {
    expect(dashboardPage).toContain("getPublicOrigin");
    expect(dashboardPage).toContain("/?promo=");
    expect(dashboardPage).not.toMatch(/https:\/\/esim\.uplisoft\.com/);
  });

  it("shows a copy button for the referral link, mirroring the existing CopyField pattern", () => {
    expect(dashboardPage).toContain('import { CopyField } from "../../account/[orderId]/CopyField"');
    expect(dashboardPage).toContain('<CopyField label="Referral link"');
  });

  it("renders the QR code for the referral link", () => {
    expect(dashboardPage).toContain("<QrCodeCard");
    expect(dashboardPage).toContain("value={referralLink}");
  });

  it("shows only the backend's safe recentCredits projection — package price, customer paid, commission, status — never a cost/margin field", () => {
    expect(dashboardPage).toContain("packagePriceCents");
    expect(dashboardPage).toContain("finalCustomerPriceCents");
    expect(dashboardPage).toContain("commissionAmountCents");
    expect(dashboardPage).toContain("commissionStatus");
    expect(dashboardPage).not.toContain("marginCents");
  });

  it("shows the referred-customer count and both balances as stats", () => {
    expect(dashboardPage).toContain("validCustomerCount");
    expect(dashboardPage).toContain("commissionBalanceCents");
    expect(dashboardPage).toContain("walletBalanceCents");
  });
});

describe("QrCodeCard", () => {
  it("is a client component generic over an arbitrary value, reusable outside the dashboard", () => {
    expect(qrCodeCard).toContain('"use client"');
    expect(qrCodeCard).toContain("value: string");
  });

  it("uses the qrcode package to render client-side, not a server-generated image", () => {
    expect(qrCodeCard).toContain('from "qrcode"');
    expect(qrCodeCard).toContain("QRCode.toDataURL");
  });
});
