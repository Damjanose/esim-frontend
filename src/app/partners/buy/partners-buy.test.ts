import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const buyPage = readFileSync("src/app/partners/buy/page.tsx", "utf8");
const packagePicker = readFileSync("src/app/partners/buy/PackagePicker.tsx", "utf8");

describe("partner buy page", () => {
  it("renders inside the shared public shell", () => {
    expect(buyPage).toContain("<Navbar />");
    expect(buyPage).toContain("<SiteFooter />");
  });

  it("is excluded from search indexing, like the other signed-in account pages", () => {
    expect(buyPage).toContain("indexable: false");
  });

  it("loads the partner record through fetchForPage, which redirects through sign-in on an expired session", () => {
    expect(buyPage).toContain('fetchForPage<Partner>("/partners/me", "/partners/buy")');
  });

  it("prompts to apply instead of showing an error when no partner record exists", () => {
    expect(buyPage).toContain("result.status === 404");
    expect(buyPage).toContain('href="/partners/request"');
  });

  it("only lets Pending/Active partners buy, sending everyone else to the status page", () => {
    expect(buyPage).toContain("BUY_STATUSES");
    expect(buyPage).toContain('new Set(["Pending", "Active"])');
    expect(buyPage).toContain('href="/partners/status"');
  });

  it("renders the package picker with the partner's wallet balance", () => {
    expect(buyPage).toContain("<PackagePicker walletBalanceCents={result.data.walletBalanceCents} />");
  });
});

describe("PackagePicker", () => {
  it("is a client component", () => {
    expect(packagePicker).toContain('"use client"');
  });

  it("reuses the existing public package catalog fetch instead of a new data source", () => {
    expect(packagePicker).toContain('from "@/services/packages"');
    expect(packagePicker).toContain("fetchPackageOptions");
    expect(packagePicker).toContain("filterPackageOptions");
  });

  it("shows only the retail price before purchase, with a note that the partner discount applies at purchase", () => {
    expect(packagePicker).toContain("retail");
    expect(packagePicker).toContain("applied automatically");
    expect(packagePicker).not.toContain("partnerBuyDiscountPct");
  });

  it("offers a self vs. gift toggle", () => {
    expect(packagePicker).toContain("sendAsGift");
    expect(packagePicker).toContain("Use for myself");
    expect(packagePicker).toContain("Send as gift");
  });

  it("purchases via the partner purchase BFF route with packageId and sendAsGift", () => {
    expect(packagePicker).toContain('"/bff/partners/me/purchase"');
    expect(packagePicker).toContain("packageId: selected.id");
    expect(packagePicker).toContain("sendAsGift");
  });

  it("redirects to sign-in on an expired/missing session", () => {
    expect(packagePicker).toContain("response.status === 401");
    expect(packagePicker).toContain('window.location.assign(`/signin?next=');
  });

  it("derives the actual amount charged from a wallet-balance diff, since the purchase response doesn't echo it", () => {
    expect(packagePicker).toContain('"/bff/partners/me"');
    expect(packagePicker).toContain("chargedCents");
  });

  it("shows a plain-text gift code when the purchase response includes one, with no dedicated gift UI", () => {
    expect(packagePicker).toContain("result.giftCode");
    expect(packagePicker).toContain("Gift code");
  });
});
