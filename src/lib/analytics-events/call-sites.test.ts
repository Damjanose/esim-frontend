import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("web analytics call sites", () => {
  it("HeroSearchDialog sends search after 800 ms of no typing, with the result count", () => {
    const text = source("src/app/HeroSearchDialog.tsx");
    expect(text).toContain("trackWebEvent({");
    expect(text).toContain('type: "search"');
    expect(text).toContain("resultCount: matches.length");
    expect(text).toContain("}, 800);");
  });

  it("DestinationBrowse sends search with the result count", () => {
    const text = source("src/app/destinations/DestinationBrowse.tsx");
    expect(text).toContain("trackWebEvent({");
    expect(text).toContain('type: "search"');
    expect(text).toContain("resultCount: filteredCountries.length");
  });

  it("PlacePicker sends flight_search only for the arrival airport", () => {
    const text = source("src/app/flights/PlacePicker.tsx");
    expect(text).toContain('type: "flight_search"');
    expect(text).toContain('role === "to"');
    expect(text).not.toContain('label === "To"');
  });

  it("FlightSearchForm passes role to each PlacePicker", () => {
    const text = source("src/app/flights/FlightSearchForm.tsx");
    expect(text).toContain('role="from"');
    expect(text).toContain('role="to"');
  });

  it("CheckoutWizard sends begin, billing, payment_method and pay_submit steps", () => {
    const text = source("src/app/checkout/CheckoutWizard.tsx");
    expect(text).toContain('type: "checkout_step"');
    expect(text).toContain('step: "begin"');
    expect(text).toContain('step: "billing"');
    expect(text).toContain('step: "payment_method"');
    expect(text).toContain('step: "pay_submit"');
  });

  it("CardStep reports the pay press through onSubmitPress", () => {
    const text = source("src/app/checkout/steps/CardStep.tsx");
    expect(text).toContain("onSubmitPress");
  });

  it("checkout/failed sends payment_failed with a FAILURE_CODES value", () => {
    const text = source("src/app/checkout/failed/FailureEvent.tsx");
    expect(text).toContain('"use client"');
    expect(text).toContain('type: "payment_failed"');
    expect(text).toContain("failureEventFor(");
    expect(source("src/app/checkout/failed/page.tsx")).toContain("<FailureEvent");
  });

  it("PromoCodeField sends promo_tap for a manually applied promo code", () => {
    const text = source("src/app/checkout/PromoCodeField.tsx");
    expect(text).toContain('type: "promo_tap"');
    expect(text).toContain('promoKind: "promo_code"');
    expect(text).toContain("if (!silent)");
  });

  it("fires payment_method for the default method too, so it depends on the selected method", () => {
    const text = source("src/app/checkout/CheckoutWizard.tsx");
    expect(text).toContain("}, [billingAddress, selectedMethod]);");
    expect(text).toContain('step: "payment_method"');
  });

  it("sends pay_submit for the PayPal and crypto pay buttons, with their method", () => {
    const wizard = source("src/app/checkout/CheckoutWizard.tsx");
    expect(wizard).toContain('paymentMethod: "paypal"');
    expect(wizard).toContain('paymentMethod: "crypto"');
    expect(source("src/app/checkout/steps/PaypalStep.tsx")).toContain("onSubmitPress");
    expect(source("src/app/checkout/steps/CryptoStep.tsx")).toContain("onSubmitPress");
  });
});
