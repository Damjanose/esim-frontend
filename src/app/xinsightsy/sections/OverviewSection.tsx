"use client";

import { formatChange, formatMoney, formatProfit, formatRate } from "@/lib/insights/format";
import type { OverviewData, ReportResponse } from "@/lib/insights/types";
import { NoteBadge } from "../ui/NoteBadge";
import { SectionState } from "../ui/SectionState";
import { StatTile } from "../ui/StatTile";
import { useInsightsReport } from "../useInsightsReport";
import type { InsightsSectionProps } from "../ui/filters";

type CountKey = "activeVisitors" | "newVisitors" | "returningVisitors" | "sessions" | "orders" | "buyers";

export function OverviewSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<OverviewData>("overview", token, filters, { onUnauthorized });
  const response = data as ReportResponse<OverviewData> | null;
  const ready = response?.data ?? null;
  const previous = response?.previous ?? null;

  const change = (key: CountKey) => (previous && ready ? formatChange(ready[key], previous[key]) : null);
  const status = state === "ready" && !ready ? "empty" : state;

  return (
    <section aria-labelledby="insights-overview" className="space-y-4">
      <h2 id="insights-overview" className="font-display text-xl font-black text-midnight">Overview</h2>
      <SectionState state={status} onRetry={retry}>
        {ready && response ? (
          <>
            <div className="flex flex-wrap gap-2">{response.notes.map((code) => <NoteBadge key={code} code={code} />)}</div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Active visitors" value={ready.activeVisitors} change={change("activeVisitors")} />
              <StatTile label="New visitors" value={ready.newVisitors} change={change("newVisitors")} />
              <StatTile label="Returning visitors" value={ready.returningVisitors} change={change("returningVisitors")} />
              <StatTile label="Sessions" value={ready.sessions} change={change("sessions")} />
              <StatTile label="Orders" value={ready.orders} change={change("orders")} hint={`${ready.topups} top-ups`} />
              <StatTile label="Buyers" value={ready.buyers} change={change("buyers")} />
              <StatTile label="Conversion" value={formatRate(ready.conversion)} hint="Buyers ÷ active visitors" />
              <StatTile label="Revenue" value={formatMoney(ready.revenue)} hint="Not added across currencies" />
              <StatTile
                label="Profit"
                value={formatProfit(ready.profit)}
                hint={ready.profit.estimatedCount > 0 ? "Before payment fees for estimated sales" : "Recorded costs"}
              />
            </div>
          </>
        ) : null}
      </SectionState>
    </section>
  );
}
