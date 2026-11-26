"use client";

import { useState } from "react";
import { formatRate } from "@/lib/insights/format";
import { stepRates } from "@/lib/insights/funnel";
import type { FunnelData } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

const STEP_LABELS: Record<string, string> = {
  marketplace: "Marketplace",
  destination: "Destination",
  begin: "Checkout opened",
  billing: "Billing",
  payment_method: "Payment method",
  pay_submit: "Pay pressed",
  paid: "Paid"
};

export function FunnelSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const [platform, setPlatform] = useState("all");
  const { state, data, retry } = useInsightsReport<FunnelData>("funnel", token, filters, { onUnauthorized });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;
  const platforms = ready ? ready.byPlatform.map((item) => item.platform) : [];
  const steps = ready
    ? platform === "all"
      ? ready.steps
      : (ready.byPlatform.find((item) => item.platform === platform)?.steps ?? [])
    : [];
  const rates = stepRates(steps);

  return (
    <section aria-labelledby="insights-funnel" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="insights-funnel" className="font-display text-xl font-black text-midnight">Funnel</h2>
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
          Platform
          <select className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-midnight" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="all">All</option>
            {platforms.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-midnight/60">Each step counts visitors who reached it.</p>
      <SectionState state={status} onRetry={retry} emptyText="No visitors in this range">
        {ready ? (
          <>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
              {rates.map((item) => (
                <li key={item.step} className="rounded-2xl border border-line bg-white p-3 shadow-card">
                  <p className="text-[12px] font-bold text-midnight/70">{STEP_LABELS[item.step] ?? item.step}</p>
                  <p className="font-display text-xl font-black text-midnight tabular-nums">{item.visitors}</p>
                  <p className="text-[12px] text-midnight/70">{formatRate(item.shareOfFirst)} of start</p>
                  <p className="text-[12px] text-midnight/70">{item.dropFromPrevious === null ? "—" : `${formatRate(item.dropFromPrevious)} drop`}</p>
                </li>
              ))}
            </ol>
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">Payment failures</h3>
              <DataTable
                caption="Payment failures"
                rowKey={(row) => `${row.paymentMethod}-${row.failureCode}`}
                rows={ready.failures}
                columns={[
                  { key: "method", label: "Method", value: (row) => row.paymentMethod },
                  { key: "code", label: "Reason", value: (row) => row.failureCode },
                  { key: "count", label: "Count", value: (row) => row.count, numeric: true }
                ]}
              />
            </div>
          </>
        ) : null}
      </SectionState>
    </section>
  );
}
