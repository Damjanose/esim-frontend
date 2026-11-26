"use client";

import { useState } from "react";
import type { ScreensData } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

type Platform = "app" | "web";

export function ScreensSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const [platform, setPlatform] = useState<Platform>("app");
  const { state, data, retry } = useInsightsReport<ScreensData>("screens", token, filters, { onUnauthorized });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;
  const rows = (ready?.rows ?? []).filter((row) => row.platform === platform);

  return (
    <section aria-labelledby="insights-screens" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="insights-screens" className="font-display text-xl font-black text-midnight">Screens</h2>
        <div role="group" aria-label="Platform" className="flex gap-1 rounded-full bg-cloud p-1">
          {(["app", "web"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={platform === value} onClick={() => setPlatform(value)} className={`rounded-full px-3 py-1 text-sm font-bold ${platform === value ? "bg-white text-midnight shadow-card" : "text-midnight/70"}`}>
              {value === "app" ? "App" : "Website"}
            </button>
          ))}
        </div>
      </div>
      <SectionState state={status} onRetry={retry} emptyText="No screens viewed in this range">
        {ready ? (
          <DataTable
            caption="Screens"
            rowKey={(row) => `${row.platform}-${row.screen}`}
            rows={rows}
            columns={[
              { key: "screen", label: "Screen", value: (row) => row.screen },
              { key: "views", label: "Views", value: (row) => row.views, numeric: true },
              { key: "visitors", label: "Visitors", value: (row) => row.visitors, numeric: true }
            ]}
          />
        ) : null}
      </SectionState>
    </section>
  );
}
