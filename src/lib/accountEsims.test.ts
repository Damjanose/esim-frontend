import { describe, expect, it } from "vitest";
import type { HeroPackageOption } from "@/services/packages";
import {
  accountPrimaryAction,
  buyAgainHref,
  daysLeft,
  describePackage,
  esimCountLine,
  esimStatusLine,
  lifecycleBadge,
  topupPlanRowPlan,
  usageMeter
} from "./accountEsims";
import type { OrderGroups, OrderSummary } from "./order-groups";
import { planDataDisc, planRowTags } from "./planRow";

const NOW = Date.parse("2026-10-01T12:00:00.000Z");

function order(overrides: Partial<OrderSummary> & { id: number }): OrderSummary {
  return {
    code: `ORD-${overrides.id}`,
    status: "completed",
    lifecycle_status: "ready",
    package_id: "mock-us-7days-1gb",
    created_at: "2026-09-01T10:00:00.000Z",
    expires_at: null,
    ...overrides
  };
}

const catalog = new Map<string, HeroPackageOption>([
  [
    "mock-us-7days-1gb",
    {
      kind: "standard",
      id: "mock-us-7days-1gb",
      country: "United States",
      countryCode: "united-states",
      flagUri: "https://flags.example/us.png",
      dataLabel: "1 GB",
      durationLabel: "7 days",
      title: "1 GB - 7 days",
      price: "€4.00",
      priceNumeric: 4,
      dataNumericGb: 1,
      durationDays: 7,
      filters: ["local"],
      query: ""
    }
  ],
  [
    "mock-xk-7days-1gb",
    {
      kind: "standard",
      id: "mock-xk-7days-1gb",
      country: "Kosovo",
      countryCode: "kosovo",
      flagUri: "",
      dataLabel: "1 GB",
      durationLabel: "7 days",
      title: "1 GB - 7 days",
      price: "€3.00",
      priceNumeric: 3,
      dataNumericGb: 1,
      durationDays: 7,
      filters: ["local"],
      query: ""
    }
  ]
]);

describe("describePackage", () => {
  it("names a plan from the catalog, else reads figures out of the package id", () => {
    expect(describePackage("mock-us-7days-1gb", catalog)).toEqual({
      title: "United States",
      details: "1 GB · 7 days",
      flagUri: "https://flags.example/us.png"
    });
    expect(describePackage("mock-xk-7days-1gb", catalog).flagUri).toBeNull();
    expect(describePackage("retired-pkg-30days-5gb", catalog)).toEqual({
      title: "eSIM plan",
      details: "5GB / 30 days",
      flagUri: null
    });
  });
});

describe("daysLeft / esimStatusLine", () => {
  it("rounds part days up and never goes below zero", () => {
    expect(daysLeft("2026-10-01T15:00:00.000Z", NOW)).toBe(1);
    expect(daysLeft("2026-10-13T12:00:00.000Z", NOW)).toBe(12);
    expect(daysLeft("2026-09-20T12:00:00.000Z", NOW)).toBe(0);
    expect(daysLeft(null, NOW)).toBeNull();
    expect(daysLeft("not-a-date", NOW)).toBeNull();
  });

  it("says how long an active plan has left, and what a ready or expired one needs", () => {
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: "2026-10-13T12:00:00.000Z" }, NOW)).toBe(
      "Active · 12 days left"
    );
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: "2026-10-02T11:00:00.000Z" }, NOW)).toBe(
      "Active · 1 day left"
    );
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: "2026-09-30T00:00:00.000Z" }, NOW)).toBe(
      "Active · Expires today"
    );
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: null }, NOW)).toBe("Active");
    expect(esimStatusLine({ lifecycle_status: "ready", expires_at: null }, NOW)).toBe("Ready to install");
    expect(esimStatusLine({ lifecycle_status: "expired", expires_at: null }, NOW)).toBe("Expired");
  });
});

describe("lifecycleBadge", () => {
  it("comes straight from lifecycle_status, with no invented states", () => {
    expect(lifecycleBadge("active")).toEqual({ label: "Active", tone: "active" });
    expect(lifecycleBadge("ready")).toEqual({ label: "Ready", tone: "ready" });
    expect(lifecycleBadge("expired")).toEqual({ label: "Expired", tone: "expired" });
    // Same rule as groupOrdersByLifecycle: a new backend status never hides a paid plan.
    expect(lifecycleBadge("something-new")).toEqual({ label: "Ready", tone: "ready" });
  });
});

describe("esimCountLine", () => {
  it("counts the live plan and every plan", () => {
    const sections: OrderGroups = {
      active: order({ id: 1, lifecycle_status: "active" }),
      ready: [order({ id: 2 }), order({ id: 3 })],
      history: [order({ id: 4, lifecycle_status: "expired" }), order({ id: 5, lifecycle_status: "expired" })]
    };
    expect(esimCountLine(sections)).toBe("1 active · 5 total");
    expect(esimCountLine({ active: null, ready: [], history: [] })).toBe("0 active · 0 total");
    expect(esimCountLine(null)).toBeNull();
  });
});

describe("buyAgainHref", () => {
  it("links the destination page only while the package is still sold", () => {
    expect(buyAgainHref("mock-us-7days-1gb", catalog)).toBe("/esim/usa");
    // Sold, but no content page: the browse fallback, as every browse link does.
    expect(buyAgainHref("mock-xk-7days-1gb", catalog)).toBe("/destinations?country=kosovo");
    expect(buyAgainHref("retired-pkg-30days-5gb", catalog)).toBeNull();
  });
});

describe("accountPrimaryAction", () => {
  const active = order({ id: 1, lifecycle_status: "active" });

  it("gives the gradient to the newest ready plan's Install, else the active plan's Top up", () => {
    expect(accountPrimaryAction({ active, ready: [order({ id: 3 }), order({ id: 2 })], history: [] })).toEqual({
      kind: "install",
      orderId: 3
    });
    expect(accountPrimaryAction({ active, ready: [], history: [] })).toEqual({ kind: "topup", orderId: 1 });
    expect(
      accountPrimaryAction({ active: null, ready: [], history: [order({ id: 4, lifecycle_status: "expired" })] })
    ).toBeNull();
  });
});

describe("usageMeter", () => {
  it("fills with the share of data left, like the app", () => {
    expect(
      usageMeter({ available: true, unlimited: false, usedPercent: 60, remainingLabel: "4 GB", totalLabel: "10 GB" })
    ).toEqual({
      state: "metered",
      leftPercent: 40,
      headline: "4 GB",
      caption: "of 10 GB remaining",
      note: null,
      label: "40% of data left: 4 GB of 10 GB"
    });
  });

  it("shows unlimited as a full ring with no cap, and unavailable usage as a note", () => {
    expect(
      usageMeter({ available: true, unlimited: true, usedPercent: 0, remainingLabel: "Unlimited", totalLabel: "Unlimited" })
    ).toMatchObject({ state: "unlimited", leftPercent: 100, headline: "Unlimited", caption: "No data cap" });
    expect(usageMeter({ available: false, message: "Usage will appear once your eSIM finishes provisioning." })).toEqual({
      state: "unavailable",
      leftPercent: null,
      headline: null,
      caption: null,
      note: "Usage will appear once your eSIM finishes provisioning.",
      label: "Usage will appear once your eSIM finishes provisioning."
    });
  });
});

describe("topupPlanRowPlan", () => {
  it("shapes a top-up offer for the plan-row disc, tags and price", () => {
    const plan = topupPlanRowPlan({
      id: "mock-topup-3gb-30days",
      title: "3 GB - 30 days",
      priceDisplay: "€9.00",
      priceNumeric: 9,
      retailPrice: 11,
      hasDiscount: true,
      amount: 3072,
      day: 30
    });
    expect(plan).toMatchObject({ dataLabel: "3 GB", durationDays: 30, price: "€9.00" });
    expect(planDataDisc(plan)).toEqual({ unlimited: false, value: "3", unit: "GB" });
    expect(planRowTags(plan, { position: null })).toEqual([{ kind: "discount", label: "-18%" }]);

    const unlimited = topupPlanRowPlan({ id: "unl", amount: 999999, day: 7, is_unlimited: true });
    expect(planDataDisc(unlimited).unlimited).toBe(true);
    expect(unlimited.title).toBe("unl");
  });
});
