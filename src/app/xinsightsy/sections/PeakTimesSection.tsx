"use client";

import { useState } from "react";
import type { PeakTimesData } from "@/lib/insights/types";
import { Heatmap } from "../ui/Heatmap";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

const ZONES = [
  { value: "visitor", label: "Visitor's time" },
  { value: "America/New_York", label: "New York" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Tirane", label: "Tirane" },
  { value: "UTC", label: "UTC" }
];

const METRICS = [
  { value: "events", label: "Events" },
  { value: "visitors", label: "Visitors" },
  { value: "orders", label: "Orders" }
] as const;

type Metric = (typeof METRICS)[number]["value"];

export function PeakTimesSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const [zone, setZone] = useState("visitor");
  const [metric, setMetric] = useState<Metric>("events");
  const { state, data, retry } = useInsightsReport<PeakTimesData>("peak-times", token, filters, { tz: zone, onUnauthorized });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;

  return (
    <section aria-labelledby="insights-peak-times" className="space-y-4">
      <h2 id="insights-peak-times" className="font-display text-xl font-black text-midnight">Peak times</h2>
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
          Time zone
          <select className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-midnight" value={zone} onChange={(event) => setZone(event.target.value)}>
            {ZONES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
          Show
          <select className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-midnight" value={metric} onChange={(event) => setMetric(event.target.value as Metric)}>
            {METRICS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      <SectionState state={status} onRetry={retry}>
        {ready ? (
          <Heatmap
            label={metric}
            cells={ready.cells.map((cell) => ({ weekday: cell.weekday, hour: cell.hour, value: cell[metric] }))}
          />
        ) : null}
      </SectionState>
    </section>
  );
}
