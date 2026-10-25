import { describe, expect, it } from "vitest";
import { destinationPlanFaqs } from "./destination-plan-faqs";
import type { DestinationPlanRow } from "./destinationPricing";

function plan(overrides: Partial<DestinationPlanRow> = {}): DestinationPlanRow {
  return {
    id: "p1",
    title: "1 GB - 7 days",
    dataLabel: "1GB",
    durationLabel: "7 Days Duration",
    network: "4G/5G",
    price: "€4.50",
    priceNumeric: 4.5,
    dataNumericGb: 1,
    durationDays: 7,
    ...overrides
  };
}

describe("destinationPlanFaqs", () => {
  it("answers price, validity, data size and calls from the live plans", () => {
    const faqs = destinationPlanFaqs({
      countryName: "Kosovo",
      plans: [plan(), plan({ id: "p2", title: "20 GB - 30 days", dataNumericGb: 20, durationDays: 30, price: "€19.00" })]
    });

    expect(faqs.map((faq) => faq.question)).toEqual([
      "What is the cheapest eSIM for Kosovo?",
      "How long do Kosovo eSIM plans last?",
      "Is there an unlimited data eSIM for Kosovo?",
      "Does the Kosovo eSIM include calls and texts?"
    ]);
    expect(faqs[0].answer).toContain("1GB for 7 days at €4.50");
    expect(faqs[1].answer).toContain("valid for 7 or 30 days");
    expect(faqs[2].answer).toContain("up to 20 GB");
    expect(faqs[3].answer).toMatch(/^No\. Kosovo plans are data-only/);
  });

  it("names an unlimited or voice plan only when one is listed", () => {
    const faqs = destinationPlanFaqs({
      countryName: "Bahamas",
      plans: [plan({ title: "Unlimited - 7 days", dataNumericGb: 999, voiceMinutes: 30, price: "€9.00" })]
    });

    expect(faqs[0].question).toBe("What is the cheapest eSIM for the Bahamas?");
    expect(faqs.find((faq) => faq.question.includes("unlimited"))?.answer).toMatch(/^Yes\. .*Unlimited - 7 days at €9\.00/);
    expect(faqs.find((faq) => faq.question.includes("calls"))?.answer).toMatch(/^Some plans do/);
  });

  it("adds the regional answer only when the hub's plans cover the country", () => {
    const faqs = destinationPlanFaqs({
      countryName: "Hungary",
      plans: [plan()],
      regional: { hubName: "Europe", lowPrice: 3, countryCount: 41 }
    });

    expect(faqs.at(-1)).toEqual({
      question: "Can one eSIM cover Hungary and nearby countries?",
      answer:
        "Yes. eSIM2you's Europe regional plans cover Hungary and 40 other countries on one eSIM, from €3.00. They suit trips that cross borders."
    });
  });

  it("claims nothing without live plans", () => {
    expect(destinationPlanFaqs({ countryName: "Kosovo", plans: [] })).toEqual([]);
  });
});
