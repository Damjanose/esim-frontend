import { describe, expect, it } from "vitest";
import { formatChange, formatMoney, formatProfit, formatRate } from "./format";

describe("formatMoney", () => {
  it("shows each currency separately, never added together", () => {
    expect(formatMoney({ byCurrency: { eur: 12345, usd: 500 }, unknownCount: 0 })).toBe("€123.45 · $5.00");
  });

  it("adds the unknown count when some sales have no amount", () => {
    expect(formatMoney({ byCurrency: { eur: 1000 }, unknownCount: 2 })).toBe("€10.00 + 2 unknown");
  });

  it("shows a dash for nothing, and null", () => {
    expect(formatMoney({ byCurrency: {}, unknownCount: 0 })).toBe("—");
    expect(formatMoney(null)).toBe("—");
  });

  it("uses the currency code for currencies without a symbol", () => {
    expect(formatMoney({ byCurrency: { chf: 250 }, unknownCount: 0 })).toBe("CHF 2.50");
  });
});

describe("formatRate", () => {
  it("gives a dash for null and a percentage with one decimal otherwise", () => {
    expect(formatRate(null)).toBe("—");
    expect(formatRate(0.1234)).toBe("12.3%");
    expect(formatRate(0)).toBe("0.0%");
  });
});

describe("formatChange", () => {
  it("shows an arrow and the percent change", () => {
    expect(formatChange(125, 100)).toBe("▲ 25.0%");
    expect(formatChange(50, 100)).toBe("▼ 50.0%");
    expect(formatChange(100, 100)).toBe("► 0.0%");
  });

  it("says new when the previous period was zero", () => {
    expect(formatChange(7, 0)).toBe("new");
  });

  it("gives a dash when there is nothing to compare", () => {
    expect(formatChange(0, 0)).toBe("—");
    expect(formatChange(null, 10)).toBe("—");
  });
});

describe("formatProfit", () => {
  it("marks profit as estimated when some costs are estimated", () => {
    const profit = { byCurrency: { eur: 4000 }, unknownCount: 0, estimatedCount: 3, recordedCount: 7 };
    expect(formatProfit(profit)).toBe("€40.00 · estimated");
  });

  it("does not mark profit when every cost is recorded", () => {
    const profit = { byCurrency: { eur: 4000 }, unknownCount: 0, estimatedCount: 0, recordedCount: 7 };
    expect(formatProfit(profit)).toBe("€40.00");
  });
});
