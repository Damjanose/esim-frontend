"use client";

import { acquisitionBarRows } from "@/lib/insights/acquisition";
import type { AcquisitionData } from "@/lib/insights/types";
import { BarList } from "../ui/BarList";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

export function AcquisitionSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<AcquisitionData>("acquisition", token, filters, { onUnauthorized, refreshKey });
  const ready = data?.data ?? null;
  const status = state === "ready" && (!ready || ready.total === 0) ? "empty" : state;

  return (
    <section aria-labelledby="insights-acquisition" className="space-y-4">
      <h2 id="insights-acquisition" className="font-display text-xl font-black text-midnight">How did you hear about us?</h2>
      <p className="text-sm text-midnight/60">Self-reported answers.</p>
      <SectionState state={status} onRetry={retry} emptyText="No answers in this range">
        {ready ? (
          <div className="space-y-4">
            <p className="text-sm font-bold text-midnight">{ready.total} answers</p>
            <BarList rows={acquisitionBarRows(ready.rows)} emptyText="No answers in this range" />
            {ready.otherTexts.length > 0 ? (
              <div>
                <h3 className="text-sm font-black text-midnight">Other, in their words</h3>
                <ul className="mt-2 space-y-1 text-sm text-midnight/80">
                  {ready.otherTexts.map((item) => (
                    <li key={item.text}>
                      “{item.text}” <span className="text-midnight/50">× {item.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionState>
    </section>
  );
}
