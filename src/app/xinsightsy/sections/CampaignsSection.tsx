"use client";

import { formatMoney } from "@/lib/insights/format";
import type { FirstSourceData, FirstSourceRow } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";
import { LinkBuilder } from "./LinkBuilder";

export function CampaignsSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<FirstSourceData>("first-source", token, filters, { onUnauthorized, refreshKey });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;

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
      <LinkBuilder />
    </section>
  );
}
