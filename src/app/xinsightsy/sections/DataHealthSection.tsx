"use client";

import type { DataHealthData } from "@/lib/insights/types";
import { formatRate } from "@/lib/insights/format";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

const PLATFORMS = ["ios", "android", "web"] as const;
const STALE_MS = 24 * 60 * 60 * 1000;

export function DataHealthSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<DataHealthData>("data-health", token, filters, { onUnauthorized });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;
  const now = Date.now();

  return (
    <section aria-labelledby="insights-data-health" className="space-y-4">
      <h2 id="insights-data-health" className="font-display text-xl font-black text-midnight">Data health</h2>
      <SectionState state={status} onRetry={retry}>
        {ready ? (
          <div className="space-y-4">
            {ready.collectionEnabled ? null : (
              <p className="rounded-2xl border border-red-200 bg-white p-4 text-sm font-bold text-red-700">
                Collection is off. Set ANALYTICS_COLLECTION_ENABLED=true after the privacy policy is live.
              </p>
            )}
            <ul className="grid gap-3 sm:grid-cols-3">
              {PLATFORMS.map((platform) => {
                const latest = ready.latestEventAt[platform];
                const stale = !latest || now - Date.parse(latest) > STALE_MS;
                return (
                  <li key={platform} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-midnight/60">{platform}</p>
                    {stale ? (
                      <p className="mt-1 text-sm font-bold text-red-700">No data</p>
                    ) : (
                      <p className="mt-1 text-sm font-bold text-midnight">{new Date(latest).toLocaleString("en-GB")}</p>
                    )}
                  </li>
                );
              })}
            </ul>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <dt className="text-[12px] font-bold text-midnight/70">Events in the last 24 hours</dt>
                <dd className="font-display text-xl font-black text-midnight">{ready.eventsLast24h}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <dt className="text-[12px] font-bold text-midnight/70">Events with no location</dt>
                <dd className="font-display text-xl font-black text-midnight">{formatRate(ready.noLocationShare)}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <dt className="text-[12px] font-bold text-midnight/70">Sales with unknown cost</dt>
                <dd className="font-display text-xl font-black text-midnight">{formatRate(ready.unknownCostSaleShare)}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <dt className="text-[12px] font-bold text-midnight/70">Sales without a saved snapshot</dt>
                <dd className="font-display text-xl font-black text-midnight">{ready.salesWithoutSnapshot}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </SectionState>
    </section>
  );
}
