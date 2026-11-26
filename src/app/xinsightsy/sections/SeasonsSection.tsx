"use client";

import { formatMoney } from "@/lib/insights/format";
import { groupNotesByMonth, monthBarHeights, monthLabel } from "@/lib/insights/seasons";
import type { SeasonsData } from "@/lib/insights/types";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useChartNotes } from "../useChartNotes";
import { useInsightsReport } from "../useInsightsReport";

export function SeasonsSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<SeasonsData>("seasons", token, filters, { onUnauthorized, refreshKey });
  const notes = useChartNotes(token, filters, { onUnauthorized, refreshKey });
  const months = data?.data.months ?? [];
  const status = state === "ready" && months.length === 0 ? "empty" : state;
  const heights = monthBarHeights(months);
  const notesByMonth = groupNotesByMonth(notes.notes);

  return (
    <section aria-labelledby="insights-seasons" className="space-y-4">
      <h2 id="insights-seasons" className="font-display text-xl font-black text-midnight">Seasons</h2>
      <p className="text-sm text-midnight/60">Orders per month, with revenue in each currency. Notes are grouped by month.</p>
      <SectionState state={status} onRetry={retry} emptyText="No orders in this range">
        {months.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <ol className="flex min-w-[480px] items-end gap-3">
              {months.map((month, index) => (
                <li key={month.month} className="flex min-w-[64px] flex-1 flex-col items-center gap-2 text-center">
                  <span className="text-xs font-bold tabular-nums text-midnight">{month.orders}</span>
                  <div className="flex h-40 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-brandBlue"
                      style={{ height: `${Math.max(heights[index] * 100, month.orders > 0 ? 3 : 0)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xs font-bold text-midnight">{monthLabel(month.month)}</span>
                  <span className="text-[11px] text-midnight/70">{formatMoney(month.revenue)}</span>
                  {month.topDestinations.length > 0 ? (
                    <span className="text-[11px] text-midnight/60">
                      {month.topDestinations.map((d) => `${d.destination} (${d.orders})`).join(", ")}
                    </span>
                  ) : null}
                  {(notesByMonth[month.month] ?? []).map((note) => (
                    <span key={note.id} className="rounded-full border border-midnight/15 px-2 py-0.5 text-[11px] text-midnight/70">
                      {note.readOnly ? "Holiday: " : ""}
                      {note.title}
                    </span>
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </SectionState>
    </section>
  );
}
