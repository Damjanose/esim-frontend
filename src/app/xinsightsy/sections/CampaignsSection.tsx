"use client";

import { formatCents, formatCostPerBuyer, formatProfitAfterAds, formatRevenuePerSpend } from "@/lib/insights/campaignReturn";
import { formatMoney } from "@/lib/insights/format";
import { singleCurrencyValue } from "@/lib/insights/singleCurrency";
import type { CampaignReturnData, CampaignReturnRow, FirstSourceData, FirstSourceRow } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";
import { LinkBuilder } from "./LinkBuilder";

export function CampaignsSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<FirstSourceData>("first-source", token, filters, { onUnauthorized, refreshKey });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;

  const ret = useInsightsReport<CampaignReturnData>("campaign-return", token, filters, { onUnauthorized, refreshKey });
  const returns = ret.data?.data ?? null;
  const returnStatus = ret.state === "ready" && (!returns || returns.rows.length === 0) ? "empty" : ret.state;

  return (
    <section aria-labelledby="insights-campaigns" className="space-y-4">
      <h2 id="insights-campaigns" className="font-display text-xl font-black text-midnight">Campaigns</h2>
      <p className="text-sm text-midnight/60">Where people first arrived in each session of the range. Direct visits have no source.</p>
      <SectionState state={status} onRetry={retry} emptyText="No campaign visits in this range">
        {ready ? (
          <>
            <DataTable<FirstSourceRow>
              caption="First source"
              rowKey={(row) => `${row.source}-${row.medium ?? ""}-${row.campaign ?? ""}`}
              rows={ready.rows}
              columns={[
                { key: "source", label: "Source", value: (row) => row.source },
                { key: "medium", label: "Medium", value: (row) => row.medium },
                { key: "campaign", label: "Campaign", value: (row) => row.campaign },
                { key: "visitors", label: "Visitors", value: (row) => row.visitors, numeric: true },
                { key: "buyers", label: "Buyers", value: (row) => row.buyers, numeric: true },
                { key: "orders", label: "Orders", value: (row) => row.orders, numeric: true },
                { key: "revenue", label: "Revenue", value: (row) => formatMoney(row.revenue), numeric: true }
              ]}
            />
            <p className="text-sm text-midnight/70">Direct: {ready.direct.visitors} visitors, {ready.direct.buyers} buyers</p>
          </>
        ) : null}
      </SectionState>

      <div className="space-y-3">
        <h3 className="font-display text-base font-black text-midnight">Return on ad spend</h3>
        <p className="text-sm text-midnight/60">Spend entered under Marketing tools, matched to the first source and campaign. Blank means no data yet.</p>
        <SectionState state={returnStatus} onRetry={ret.retry} emptyText="No ad spend or campaign buyers in this range">
          {returns && returns.rows.length > 0 ? (
            <DataTable<CampaignReturnRow>
              caption="Return on ad spend"
              rowKey={(row) => `${row.source}-${row.medium ?? ""}-${row.campaign ?? ""}`}
              rows={returns.rows}
              columns={[
                { key: "source", label: "Source", value: (row) => row.source },
                { key: "campaign", label: "Campaign", value: (row) => row.campaign },
                { key: "spend", label: "Spend", value: (row) => formatCents(row.spend), sortValue: (row) => singleCurrencyValue(row.spend), numeric: true },
                { key: "buyers", label: "Buyers", value: (row) => row.buyers, numeric: true },
                { key: "costPerBuyer", label: "Cost per buyer", value: (row) => formatCostPerBuyer(row.costPerBuyer), sortValue: (row) => singleCurrencyValue(row.costPerBuyer), numeric: true },
                { key: "revenuePerSpend", label: "Revenue per spend", value: (row) => formatRevenuePerSpend(row.revenuePerSpend), sortValue: (row) => row.revenuePerSpend, numeric: true },
                { key: "profitAfterAds", label: "Profit after ads", value: (row) => formatProfitAfterAds(row.profitAfterAds), sortValue: (row) => singleCurrencyValue(row.profitAfterAds), numeric: true }
              ]}
            />
          ) : null}
        </SectionState>
        {returns && returns.unmatchedSpend.length > 0 ? (
          <div>
            <h4 className="text-sm font-black text-midnight">Unmatched spend</h4>
            <p className="text-xs text-midnight/60">These entries match no campaign visit in this range, so they have no return yet.</p>
            <ul className="mt-2 space-y-1 text-sm text-midnight/80">
              {returns.unmatchedSpend.map((item) => (
                <li key={`${item.source}|${item.campaign}`}>
                  {item.source} / {item.campaign}: {formatCents(item.spend)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <LinkBuilder />
    </section>
  );
}
