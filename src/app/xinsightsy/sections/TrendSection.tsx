"use client";

import { notePositions } from "@/lib/insights/notes";
import { chartWidth, linePath, trendGeometry } from "@/lib/insights/trend";
import type { ChartNote, DailyData } from "@/lib/insights/types";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useChartNotes } from "../useChartNotes";
import { useInsightsReport } from "../useInsightsReport";

const HEIGHT = 200;
const PAD = 16;

export function TrendSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<DailyData>("daily", token, filters, { onUnauthorized, refreshKey });
  const notesState = useChartNotes(token, filters, { onUnauthorized, refreshKey });
  const days = data?.data.days ?? [];
  const status = state === "ready" && days.length === 0 ? "empty" : state;

  const width = chartWidth(days.length);
  const geometry = trendGeometry(days, { width, height: HEIGHT, pad: PAD });
  const markers = notePositions(notesState.notes, days.map((day) => day.date));

  return (
    <section aria-labelledby="insights-trend" className="space-y-4">
      <h2 id="insights-trend" className="font-display text-xl font-black text-midnight">Daily trend</h2>
      <p className="text-sm text-midnight/60">Visitors as a line, orders as bars, one point per day.</p>
      <SectionState state={status} onRetry={retry} emptyText="No activity in this range">
        {days.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-x-auto pb-2">
              <div style={{ width }} className="relative">
                <svg
                  role="img"
                  aria-label="Visitors and orders per day"
                  width={width}
                  height={HEIGHT}
                  viewBox={`0 0 ${width} ${HEIGHT}`}
                  className="block"
                >
                  {geometry.bars.map((bar) => (
                    <rect key={`bar-${bar.date}`} x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx={2} className="fill-brandTeal">
                      <title>{`${bar.date}: ${bar.value} orders`}</title>
                    </rect>
                  ))}
                  <path d={linePath(geometry.line)} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-brandBlue" />
                </svg>
                <div className="relative h-8">
                  {markers.map(({ note, index }) => (
                    <NoteMarker key={note.id} note={note} x={geometry.line[index].x} />
                  ))}
                </div>
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-midnight/70">
              <li>Visitors</li>
              <li>Orders</li>
              <li>Admin note</li>
              <li>Holiday (built in)</li>
            </ul>
            {notesState.state === "error" ? (
              <p className="text-sm text-midnight/60">Notes could not load. {notesState.error}</p>
            ) : null}
            {days.length > 0 ? (
              <p className="text-xs text-midnight/50">
                Busiest day: {geometry.maxVisitors.toLocaleString("en-GB")} visitors
              </p>
            ) : null}
          </div>
        ) : null}
      </SectionState>
    </section>
  );
}

function NoteMarker({ note, x }: { note: ChartNote; x: number }) {
  const label = `${note.title}, ${note.date}`;
  return (
    <span className="group absolute top-0 -translate-x-1/2" style={{ left: x }}>
      <button
        type="button"
        aria-label={label}
        title={label}
        className={
          note.readOnly
            ? "block h-3 w-3 rounded-full border-2 border-dashed border-brandTeal bg-white"
            : "block h-3 w-3 rounded-full bg-midnight"
        }
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max max-w-[200px] -translate-x-1/2 rounded-md bg-midnight px-2 py-1 text-xs text-white group-hover:block group-focus-within:block"
      >
        {note.readOnly ? "Holiday: " : ""}
        {note.title}
      </span>
    </span>
  );
}
