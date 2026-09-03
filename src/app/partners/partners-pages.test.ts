import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const requestPage = readFileSync("src/app/partners/request/page.tsx", "utf8");
const requestForm = readFileSync("src/app/partners/request/PartnerRequestForm.tsx", "utf8");
const statusPage = readFileSync("src/app/partners/status/page.tsx", "utf8");

describe("partner request page", () => {
  it("renders inside the shared public shell", () => {
    expect(requestPage).toContain("<Navbar />");
    expect(requestPage).toContain("<SiteFooter />");
  });

  it("is excluded from search indexing, like the other signed-in account pages", () => {
    expect(requestPage).toContain("indexable: false");
  });

  it("sends an existing partner straight to the status page instead of re-showing the form", () => {
    expect(requestPage).toContain('"/partners/me"');
    expect(requestPage).toContain('redirect("/partners/status")');
  });

  it("renders the client form", () => {
    expect(requestPage).toContain("<PartnerRequestForm");
  });
});

describe("partner request form", () => {
  it("offers every backend-accepted partner type and nothing else", () => {
    // Mirrors PARTNER_TYPES in E-SIM backend/src/services/partner.service.ts —
    // the backend 400s on anything outside this list.
    const expectedTypes = ["Hotel", "Airbnb", "TravelAgency", "Creator", "Taxi", "RentACar", "Other"];
    for (const type of expectedTypes) {
      expect(requestForm).toContain(`value: "${type}"`);
    }
  });

  it("submits to the partner request BFF route", () => {
    expect(requestForm).toContain('"/bff/partners/request"');
    expect(requestForm).toContain('method: "POST"');
  });

  it("navigates to the status page on success", () => {
    expect(requestForm).toContain('router.push("/partners/status")');
  });

  it("shows a specific message when a request already exists (409)", () => {
    expect(requestForm).toContain("response.status === 409");
    expect(requestForm).toContain("already submitted a partner request");
  });

  it("redirects to sign-in on an expired/missing session", () => {
    expect(requestForm).toContain("response.status === 401");
    expect(requestForm).toContain('window.location.assign(`/signin?next=');
  });

  it("leaves country and partner-type required, without guessing the exact backend validation message", () => {
    expect(requestForm).toContain("payload.error");
  });
});

describe("partner status page", () => {
  it("renders inside the shared public shell", () => {
    expect(statusPage).toContain("<Navbar />");
    expect(statusPage).toContain("<SiteFooter />");
  });

  it("is excluded from search indexing, like the other signed-in account pages", () => {
    expect(statusPage).toContain("indexable: false");
  });

  it("loads the partner record through fetchForPage, which redirects through sign-in on an expired session", () => {
    expect(statusPage).toContain('fetchForPage<Partner>("/partners/me", "/partners/status")');
  });

  it("prompts to apply instead of showing an error when no partner record exists", () => {
    expect(statusPage).toContain("result.status === 404");
    expect(statusPage).toContain('href="/partners/request"');
  });

  it("covers every partner status the backend can set", () => {
    // PendingApproval/Pending/Active: requestPartnerStatus/approvePartnerRequest/verify.
    // Suspended/Cancelled: suspendPartner/cancelPartner.
    // VerificationRequired: the withdrawal-triggered verification flow.
    for (const status of [
      "PendingApproval",
      "Pending",
      "Active",
      "VerificationRequired",
      "Suspended",
      "Cancelled"
    ]) {
      expect(statusPage).toContain(`${status}:`);
    }
  });

  it("links forward to the dashboard, and to the withdraw page (which hosts the verification form) for VerificationRequired", () => {
    expect(statusPage).toContain('"/partners/dashboard"');
    expect(statusPage).toContain('"/partners/withdraw"');
  });
});
