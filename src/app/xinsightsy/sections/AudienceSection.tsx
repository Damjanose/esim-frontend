"use client";

import type { AudienceData } from "@/lib/insights/types";
import { BarList } from "../ui/BarList";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

export function AudienceSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<AudienceData>("audience", token, filters, { onUnauthorized });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;
  const toRows = (rows: { key: string; visitors: number }[]) => rows.map((row) => ({ label: row.key, value: row.visitors }));

  return (
    <section aria-labelledby="insights-audience" className="space-y-4">
      <h2 id="insights-audience" className="font-display text-xl font-black text-midnight">Audience</h2>
      <SectionState state={status} onRetry={retry}>
        {ready ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">Languages</h3>
              <BarList rows={toRows(ready.locales)} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">Devices</h3>
              <BarList rows={toRows(ready.deviceTypes)} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">Platforms</h3>
              <BarList rows={toRows(ready.platforms)} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-black text-midnight">App versions</h3>
              <BarList rows={toRows(ready.appVersions)} />
            </div>
          </div>
        ) : null}
      </SectionState>
    </section>
  );
}
