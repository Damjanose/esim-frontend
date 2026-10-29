import { describe, expect, it } from "vitest";
import {
  formatData,
  formatDate,
  formatMoney,
  formatAmounts,
  providerSummary,
  profitLabel,
  type ProviderSim,
  type ProviderDetails,
} from "./dashboard-model";

const sim: ProviderSim = {
  iccid: "89000000001",
  status: "ACTIVE",
  activatedAt: null,
  expiresAt: null,
  remainingMb: 512,
  totalMb: 1024,
  isUnlimited: false,
  remainingVoice: null,
  totalVoice: null,
  remainingText: null,
  totalText: null,
  error: null,
};
const details = (sims = [sim]): ProviderDetails => ({
  checkedAt: "2026-10-29T12:00:00Z",
  sims,
});

describe("dashboard provider and financial presentation", () => {
  it("distinguishes unqueried, failed, missing and mixed provider results", () => {
    expect(providerSummary(undefined).label).toBe("Checking Airalo");
    expect(providerSummary({ error: "Try again" }).label).toBe("Check failed");
    expect(providerSummary({ data: details([]) }).label).toBe("Unavailable");
    expect(
      providerSummary({ data: details([{ ...sim, status: "NOT_ACTIVE" }]) })
        .label,
    ).toBe("Not active");
    expect(
      providerSummary({
        data: details([
          sim,
          { ...sim, iccid: "89000000002", status: "EXPIRED" },
        ]),
      }).label,
    ).toBe("Mixed status");
    expect(
      providerSummary({ data: details([{ ...sim, status: "FUTURE_STATUS" }]) })
        .label,
    ).toBe("Unknown");
    expect(
      providerSummary({
        data: details([{ ...sim, status: null, error: "Unavailable" }]),
      }).label,
    ).toBe("Unavailable");
  });

  it("does not turn unlimited, unknown or depleted usage into the same value", () => {
    expect(formatData(null, true)).toBe("Unlimited");
    expect(formatData(null, false)).toBe("Unavailable");
    expect(formatData(0, false)).toBe("0 MB");
    expect(formatData(1536, false)).toBe("1.5 GB");
    expect(formatData(-1, false)).toBe("Unavailable");
    expect(formatData(Number.NaN, false)).toBe("Unavailable");
  });

  it("keeps currencies separate and avoids false zeroes for missing amounts", () => {
    expect(formatAmounts({ eur: 1250, usd: 700 })).toBe("€12.50 · $7.00");
    expect(formatAmounts({})).toBe("—");
    expect(formatMoney(null, "eur")).toBe("—");
    expect(formatMoney(0, "eur")).toBe("€0.00");
    expect(formatMoney(100, "INVALID")).toBe("—");
    expect(
      profitLabel({ profitByCurrency: { eur: 500 }, missingCostCount: 1 }),
    ).toBe("Incomplete");
    expect(
      profitLabel({ profitByCurrency: { eur: 500 }, missingCostCount: 0 }),
    ).toBe("€5.00");
  });

  it("formats reporting timestamps in UTC and tolerates malformed historical values", () => {
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDate("2026-10-29T23:45:00Z")).toContain("23:45");
  });
});
