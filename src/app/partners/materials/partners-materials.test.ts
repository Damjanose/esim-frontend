import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const materialsPage = readFileSync("src/app/partners/materials/page.tsx", "utf8");
const readme = readFileSync("public/partner-materials/README.md", "utf8");

// Parsed straight out of the MATERIALS array's source text rather than
// imported (the page module pulls in server-only deps) or hand-duplicated
// (which would need manual upkeep on every file drop, the exact problem
// this self-updating check exists to avoid).
const MATERIALS = [...materialsPage.matchAll(/href: "([^"]+)",\s*comingSoon: (true|false)/g)].map(
  ([, href, comingSoon]) => ({ href, comingSoon: comingSoon === "true" })
);

describe("partner materials page", () => {
  it("renders inside the shared public shell", () => {
    expect(materialsPage).toContain("<Navbar />");
    expect(materialsPage).toContain("<SiteFooter />");
  });

  it("is excluded from search indexing, like the other signed-in account pages", () => {
    expect(materialsPage).toContain("indexable: false");
  });

  it("loads the partner record through fetchForPage, which redirects through sign-in on an expired session", () => {
    expect(materialsPage).toContain('fetchForPage<Partner>("/partners/me", "/partners/materials")');
  });

  it("prompts to apply instead of showing an error when no partner record exists", () => {
    expect(materialsPage).toContain("result.status === 404");
    expect(materialsPage).toContain('href="/partners/request"');
  });

  it("does not status-gate beyond the 404 case — any existing partner record can see their materials", () => {
    // Regression guard: unlike the dashboard page, this page has no
    // DASHBOARD_STATUSES-style allowlist sending non-Active/Pending
    // partners back to /partners/status.
    expect(materialsPage).not.toContain("DASHBOARD_STATUSES");
  });

  it("builds the referral link from the promo code and the public origin, not a hardcoded domain", () => {
    expect(materialsPage).toContain("getPublicOrigin");
    expect(materialsPage).toContain("/?promo=");
    expect(materialsPage).not.toMatch(/https:\/\/esim\.uplisoft\.com/);
  });

  it("guards the referral link on the promo code existing, so a not-yet-approved partner never gets an empty QR/copy field", () => {
    // referralLink stays null unless result.data.promoCode is truthy — this
    // matters more here than on the dashboard, since this page (unlike
    // dashboard/buy/withdraw) is reachable by ANY partner status, including
    // PendingApproval, before a promo code has ever been generated.
    expect(materialsPage).toContain("result.data.promoCode");
    expect(materialsPage).toMatch(/referralLink\s*\?\s*\(/);
  });

  it("shows a copy button for the referral link, mirroring the dashboard's CopyField pattern", () => {
    expect(materialsPage).toContain('import { CopyField } from "../../account/[orderId]/CopyField"');
    expect(materialsPage).toContain('<CopyField label="Referral link"');
  });

  it("reuses the dashboard's generic QrCodeCard for the referral link", () => {
    expect(materialsPage).toContain('import { QrCodeCard } from "../dashboard/QrCodeCard"');
    expect(materialsPage).toContain("<QrCodeCard");
    expect(materialsPage).toContain("value={referralLink}");
  });

  it("lists all seven template types from the plan", () => {
    for (const label of [
      "A4 flyer",
      "A5 flyer",
      "Hotel counter card",
      "Instagram story",
      "Instagram post",
      "Facebook post",
      "WhatsApp share image"
    ]) {
      expect(materialsPage).toContain(label);
    }
  });

  it("points each template at a file under /partner-materials/ with a sensible extension", () => {
    expect(materialsPage).toContain("/partner-materials/flyer-a4.pdf");
    expect(materialsPage).toContain("/partner-materials/flyer-a5.pdf");
    expect(materialsPage).toContain("/partner-materials/counter-card.pdf");
    expect(materialsPage).toContain("/partner-materials/instagram-story.png");
    expect(materialsPage).toContain("/partner-materials/instagram-post.png");
    expect(materialsPage).toContain("/partner-materials/facebook-post.png");
    expect(materialsPage).toContain("/partner-materials/whatsapp-share.png");
  });

  it("marks a template as coming soon exactly when its file hasn't landed under public/partner-materials yet", () => {
    // Self-updating: as designer-delivered files land one at a time (see
    // docs/partner-materials-brief.md), this test tracks reality instead of
    // needing a manual edit for each drop.
    expect(MATERIALS.length).toBe(7);
    for (const material of MATERIALS) {
      const fileExists = existsSync(`public${material.href}`);
      expect(material.comingSoon).toBe(!fileExists);
    }
  });

  it("never renders a commission or discount percentage anywhere on the page", () => {
    // "commission" itself is fine in prose (e.g. "start earning commission"),
    // but no percentage figure — the actual financial internal — may appear.
    expect(materialsPage).not.toMatch(/%/);
    expect(materialsPage).not.toMatch(/commissionRateBps|commissionPercent|discountPercent/i);
  });
});

describe("public/partner-materials README", () => {
  it("explains the directory holds pending design assets, not real files", () => {
    expect(readme).toMatch(/no real files/i);
  });
});
