import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { destinationAnswerFaq } from "./destination-answer";
import type { DestinationPlanRow } from "./destinationPricing";

function plan(overrides: Partial<DestinationPlanRow> = {}): DestinationPlanRow {
  return {
    id: "p1",
    title: "1 GB - 7 days",
    dataLabel: "1 GB",
    durationLabel: "7 days",
    network: "",
    price: "€4.50",
    priceNumeric: 4.5,
    dataNumericGb: 1,
    durationDays: 7,
    ...overrides
  };
}

describe("destinationAnswerFaq", () => {
  it("answers the branded question from live plans: count, from-price, validity range", () => {
    const faq = destinationAnswerFaq({
      countryName: "Albania",
      plans: [plan(), plan({ id: "p2", priceNumeric: 19, durationDays: 30 })],
      offer: { lowPrice: 4.5, highPrice: 19, currency: "EUR", offerCount: 2 }
    });

    expect(faq?.question).toBe("Does eSIM2you work in Albania?");
    expect(faq?.answer).toBe(
      "Yes. eSIM2you sells 2 prepaid travel eSIM data plans for Albania, from €4.50, valid 7 to 30 days. Install the eSIM before you travel and turn on its data line when you arrive."
    );
  });

  it("states one validity when every plan has the same length", () => {
    const faq = destinationAnswerFaq({
      countryName: "Italy",
      plans: [plan({ network: "4G/5G" }), plan({ id: "p2", priceNumeric: 9 })],
      offer: { lowPrice: 4.5, highPrice: 9, currency: "EUR", offerCount: 2 }
    });

    expect(faq?.answer).toContain("from €4.50, valid 7 days.");
    // network is a speed label with a "4G/5G" fallback, not an operator, so it
    // never goes into a quotable coverage claim.
    expect(faq?.answer).not.toContain("4G");
  });

  it("uses the singular for one plan and skips validity it doesn't know", () => {
    const faq = destinationAnswerFaq({
      countryName: "Greece",
      plans: [plan({ durationDays: 0 })],
      offer: { lowPrice: 4.5, highPrice: 4.5, currency: "EUR", offerCount: 1 }
    });

    expect(faq?.answer).toBe(
      "Yes. eSIM2you sells 1 prepaid travel eSIM data plan for Greece, from €4.50. Install the eSIM before you travel and turn on its data line when you arrive."
    );
  });

  it("puts 'the' before names that take it in a sentence", () => {
    const offer = { lowPrice: 4.5, highPrice: 4.5, currency: "EUR", offerCount: 1 };
    const uk = destinationAnswerFaq({ countryName: "UK", plans: [plan()], offer });
    const balkans = destinationAnswerFaq({ countryName: "Balkans", plans: [plan()], offer });

    expect(uk?.question).toBe("Does eSIM2you work in the UK?");
    expect(uk?.answer).toContain("data plan for the UK,");
    expect(balkans?.question).toBe("Does eSIM2you work in the Balkans?");
  });

  it("returns nothing without live plans, so the page never claims coverage it can't show", () => {
    expect(destinationAnswerFaq({ countryName: "Albania", plans: [] })).toBeNull();
    expect(destinationAnswerFaq({ countryName: "Albania", plans: [plan()] })).toBeNull();
  });

  it("leads both the visible FAQ and the FAQPage schema on /esim pages", () => {
    const source = readFileSync(join(process.cwd(), "src/app/EsimDestinationPage.tsx"), "utf8");

    expect(source).toContain("const answerFaq = destinationAnswerFaq({ countryName, plans, offer });");
    expect(source).toContain("          faqs,\n");
    expect(source).toContain("{faqs.map((faq) => (");
    expect(source).not.toContain("page.faqs.map");
  });
});
