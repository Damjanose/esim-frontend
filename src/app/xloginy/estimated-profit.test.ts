import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isEstimatedProfit } from "./dashboard-model";

describe("estimated profit badge", () => {
  it("shows for a summary with estimated sales", () => {
    expect(isEstimatedProfit({ estimatedProfitCount: 2 })).toBe(true);
  });

  it("shows for a row whose profit status is estimated", () => {
    expect(isEstimatedProfit({ profitStatus: "estimated" })).toBe(true);
  });

  it("does not show when every sale has recorded costs", () => {
    expect(isEstimatedProfit({ estimatedProfitCount: 0 })).toBe(false);
    expect(isEstimatedProfit({ profitStatus: "recorded" })).toBe(false);
    expect(isEstimatedProfit({})).toBe(false);
  });

  it("the finance cards render the badge", () => {
    const text = readFileSync("src/app/xloginy/DashboardFinances.tsx", "utf8");
    expect(text).toContain("isEstimatedProfit(");
    expect(text).toContain(">estimated<");
  });
});
