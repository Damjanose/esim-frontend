import { describe, expect, it } from "vitest";
import { formatCostPerBuyer, formatProfitAfterAds, formatRevenuePerSpend } from "./campaignReturn";

describe("campaign return formatting", () => {
  it("shows unknown, never 0, when there is no cost per buyer", () => {
    expect(formatCostPerBuyer({})).toBe("unknown");
    expect(formatCostPerBuyer({ usd: 1250 })).toBe("$12.50");
  });

  it("shows revenue per spend as a multiple, or unknown when null", () => {
    expect(formatRevenuePerSpend(null)).toBe("unknown");
    expect(formatRevenuePerSpend(2.5)).toBe("2.50×");
    expect(formatRevenuePerSpend(0)).toBe("0.00×");
  });

  it("shows profit after ads per currency, with a minus sign for losses", () => {
    expect(formatProfitAfterAds({})).toBe("unknown");
    expect(formatProfitAfterAds({ eur: 1000, usd: -500 })).toBe("€10.00 · −$5.00");
  });
});
