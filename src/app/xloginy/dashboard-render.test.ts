import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TodayCards, DailyEarnings } from "./DashboardFinances";
import { PurchaseDetails } from "./PurchaseList";
import type { Dashboard, Purchase } from "./dashboard-model";

const earnings = {
  date: "2026-10-29",
  purchases: 2,
  revenueByCurrency: { eur: 2500 },
  costByCurrency: { eur: 1000 },
  profitByCurrency: { eur: 1500 },
  missingCostCount: 0,
};
const dashboard: Dashboard = {
  today: earnings,
  summary: {
    userCount: 45,
    purchaseCount: 2,
    revenueByCurrency: { eur: 2500 },
    costByCurrency: { eur: 1000 },
    profitByCurrency: { eur: 1500 },
    latestPurchaseAt: null,
  },
  purchases: [],
  users: [],
  recentOtpRequests: [],
  purchasesPagination: { page: 1, pageSize: 10, total: 2 },
  usersPagination: { page: 1, pageSize: 10, total: 45 },
  otpPagination: { page: 1, pageSize: 10, total: 0 },
};
const purchase = {
  id: "order1",
  userEmail: "traveler@example.test",
  packageId: "france-1gb",
  airaloId: 123,
  paymentStatus: "completed",
  paymentAmountCents: 1250,
  paymentCurrency: "eur",
  costCents: null,
  costCurrency: "eur",
  providerCreatedAt: "2026-10-29T12:00:00Z",
  network: "Example network",
} as Purchase;

describe("rendered dashboard financial and package detail", () => {
  it("renders server totals rather than visible purchase/user page lengths", () => {
    const html = renderToStaticMarkup(
      React.createElement(TodayCards, { dashboard, onUsers() {} }),
    );
    expect(html).toContain("€25.00");
    expect(html).toContain("€15.00");
    expect(html).toContain(">45<");
    expect(html).toContain("Before fees &amp; commissions");
  });
  it("shows zero on a no-sales day instead of implying unavailable financial data", () => {
    const html = renderToStaticMarkup(
      React.createElement(TodayCards, {
        dashboard: {
          ...dashboard,
          today: {
            ...earnings,
            purchases: 0,
            revenueByCurrency: {},
            costByCurrency: {},
            profitByCurrency: {},
          },
        },
        onUsers() {},
      }),
    );
    expect(html).not.toContain(">—<");
    expect(html.match(/>0<\/p>/g)?.length).toBe(3);
  });
  it("shows newest day first and marks unknown-cost profit incomplete", () => {
    const html = renderToStaticMarkup(
      React.createElement(DailyEarnings, {
        days: [
          { ...earnings, date: "2026-10-28" },
          { ...earnings, missingCostCount: 1 },
        ],
        page: 1,
        onPageChange() {},
      }),
    );
    expect(html.indexOf("29 Oct")).toBeLessThan(html.indexOf("28 Oct"));
    expect(html).toContain("Incomplete");
    expect(html).toContain("1 cost(s) unavailable");
  });
  it("keeps payment status separate from Airalo activation and renders remaining voice/text", () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseDetails, {
        purchase,
        retry() {},
        provider: {
          data: {
            checkedAt: "2026-10-29T12:00:00Z",
            sims: [
              {
                iccid: "89000000001",
                status: "NOT_ACTIVE",
                activatedAt: null,
                expiresAt: null,
                remainingMb: 0,
                totalMb: 0,
                isUnlimited: true,
                remainingVoice: 7,
                totalVoice: 10,
                remainingText: 5,
                totalText: 10,
                error: null,
              },
            ],
          },
        },
      }),
    );
    expect(html).toContain("completed");
    expect(html).toContain("Not active");
    expect(html).toContain("Unlimited");
    expect(html).toContain("7 of 10");
    expect(html).toContain("5 of 10");
    expect(html).not.toContain("0 MB");
  });
});
