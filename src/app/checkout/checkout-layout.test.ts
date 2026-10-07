import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/checkout/page.tsx", "utf8");
const section = readFileSync("src/app/checkout/CheckoutPriceSection.tsx", "utf8");
const wizard = readFileSync("src/app/checkout/CheckoutWizard.tsx", "utf8");
const promoField = readFileSync("src/app/checkout/PromoCodeField.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("checkout page layout (spec option B)", () => {
  it("clips instead of hiding overflow, so the sticky summary and Pay bar can stick (f215)", () => {
    expect(page).toContain('<main className="min-h-screen overflow-x-clip');
    expect(page).not.toContain("overflow-x-hidden");
    // The gutter the sticky Pay bar bleeds into (CardStep: -mx-4 sm:-mx-6).
    expect(page).toContain("px-4 pb-16 pt-[92px] sm:px-6");
  });

  it("leads the left column with the eyebrow, plan title and the same sub-copy", () => {
    expect(page).toContain("Secure checkout");
    expect(page).toContain("{plan.title}");
    expect(page).toContain("Review your plan and pay below.");
    expect(page.indexOf("<CheckoutPriceSection")).toBeLessThan(page.indexOf("Secure checkout"));
    expect(section).toContain("{children}");
  });

  it("puts the one summary first in the DOM (phone bar under the top bar) and in the right column at lg", () => {
    expect(section).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(section).toContain('className="lg:col-start-2 lg:row-start-1"');
    expect(section.indexOf("<OrderSummary")).toBeLessThan(section.indexOf("<CheckoutWizard"));
    expect(section.match(/<OrderSummary\b/g)).toHaveLength(1);
  });

  it("keeps the sign-in gate and the partner-code gating of the payment intent", () => {
    expect(section).toContain("Sign in to complete your purchase");
    expect(section).toContain("href={`/signin?next=${encodeURIComponent(`/checkout?package=${plan.id}`)}`}");
    expect(section).toContain("disabled={promoPending}");
    expect(wizard).toContain("window.location.assign(`/signin?next=${encodeURIComponent(`/checkout?package=${packageId}`)}`)");
    expect(wizard).toContain("Payment reference:");
  });

  it("never shifts step 02 or the footer while the client steps load (CLS 0)", () => {
    expect(wizard).toContain("onLoaded={markBillingLoaded}");
    expect(wizard).toContain('${billingLoaded ? "" : "invisible"}');
    // The footer starts below the fold, so the card step streaming in can't move it on screen.
    expect(page).toContain("min-h-[calc(100svh+24px)]");
  });

  it("shows the Pokpay note once per screen: in step 02 below lg, in the summary at lg", () => {
    expect(wizard).toContain('noteClassName="lg:hidden"');
    expect(wizard).toContain("{PAYMENT_TRUST_NOTE}");
  });

  it("restyles the partner-code field with the shared controls and a flat Apply", () => {
    expect(promoField).toContain("FIELD_CONTROL_CLASSES");
    expect(promoField).toMatch(/size="md" type="submit" variant="tint"/);
    expect(promoField).not.toContain("bg-mist");
    for (const source of [page, section, wizard, promoField]) {
      expect(source).not.toMatch(HEX);
    }
  });
});
