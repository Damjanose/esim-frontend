"use client";

import type { SearchesData } from "@/lib/insights/types";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

export function SearchesSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const { state, data: report, retry } = useInsightsReport<SearchesData>("searches", token, filters, { onUnauthorized });
  const data = report?.data ?? null;
  const status = state === "ready" && !data ? "empty" : state;

  return (
    <section aria-labelledby="insights-searches" className="space-y-4">
      <h2 id="insights-searches" className="font-display text-xl font-black text-midnight">Searches</h2>
      <p className="text-sm text-midnight/60">Only terms searched by 3 or more people are shown.</p>
      <SectionState state={status} onRetry={retry} emptyText="No searches in this range">
        {data ? (
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">Top searches</h3>
              <ol className="space-y-1 text-sm">
                {data.top.map((item) => (
                  <li key={item.term} className="flex justify-between gap-2"><span>{item.term}</span><span className="tabular-nums">{item.count}</span></li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">No results</h3>
              <ol className="space-y-1 text-sm">
                {data.zeroResults.map((item) => (
                  <li key={item.term} className="flex justify-between gap-2"><span>{item.term}</span><span className="tabular-nums">{item.count}</span></li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">Flight airports</h3>
              <ol className="space-y-1 text-sm">
                {data.flightAirports.map((item) => (
                  <li key={item.airport} className="flex justify-between gap-2"><span>{item.airport}</span><span className="tabular-nums">{item.count}</span></li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </SectionState>
    </section>
  );
}
