"use client";

import { formatDaysAway, pricingHref, upcomingHolidayRange, upcomingHolidays } from "@/lib/insights/holidays";
import { noteMarkers } from "@/lib/insights/notes";
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
  const markers = noteMarkers(notesState.notes, days.map((day) => day.date));

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
                  {days.length === 1 ? (
                    <circle cx={geometry.line[0].x} cy={geometry.line[0].y} r={3} className="fill-brandBlue" />
                  ) : (
                    <path d={linePath(geometry.line)} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-brandBlue" />
                  )}
                </svg>
                <div className="relative h-8">
                  {markers.map(({ date, index, notes }) => (
                    <NoteMarker key={date} notes={notes} x={geometry.line[index].x} />
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
            <p className="text-xs text-midnight/50">Busiest day: {geometry.maxVisitors.toLocaleString("en-GB")} visitors</p>
          </div>
        ) : null}
      </SectionState>
      <UpcomingHolidays token={token} onUnauthorized={onUnauthorized} refreshKey={refreshKey} />
    </section>
  );
}

/** Holidays worldwide in the next 90 days, whatever range the chart shows, to time discounts. */
function UpcomingHolidays({ token, onUnauthorized, refreshKey }: Pick<InsightsSectionProps, "token" | "onUnauthorized" | "refreshKey">) {
  const today = new Date().toISOString().slice(0, 10);
  const range = upcomingHolidayRange(today);
  const notesState = useChartNotes(token, range, { onUnauthorized, refreshKey });
  const holidays = upcomingHolidays(notesState.notes, today);

  return (
    <div className="space-y-3 rounded-2xl border border-midnight/10 p-4">
      <div>
        <h3 className="font-display text-base font-black text-midnight">Upcoming holidays</h3>
        <p className="text-sm text-midnight/60">The next 90 days worldwide. Plan a discount opens pricing for that country.</p>
      </div>
      {notesState.state === "loading" ? <p className="text-sm text-midnight/60">Loading holidays…</p> : null}
      {notesState.state === "error" ? (
        <p className="text-sm text-midnight/60">
          Holidays could not load. {notesState.error}{" "}
          <button type="button" onClick={notesState.retry} className="font-bold text-brandBlue underline">
            Try again
          </button>
        </p>
      ) : null}
      {notesState.state === "ready" && holidays.length === 0 ? (
        <p className="text-sm text-midnight/60">No holidays in the next 90 days.</p>
      ) : null}
      {notesState.state === "ready" && holidays.length > 0 ? (
        <ul className="divide-y divide-midnight/10">
          {holidays.map((holiday) => (
            <li key={holiday.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-midnight">{holiday.title}</p>
                <p className="text-xs text-midnight/60">
                  <span className="tabular-nums">{holiday.date}</span> · {formatDaysAway(holiday.daysAway)}
                  {holiday.markets.length === 0 ? " · Worldwide" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {holiday.markets.length === 0 ? (
                  <PlanDiscountLink href={pricingHref()} label="Plan discount" />
                ) : (
                  holiday.markets.map((market) => (
                    <PlanDiscountLink key={market} href={pricingHref(market)} label={market} />
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PlanDiscountLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      title={`Plan a discount: ${label}`}
      className="rounded-full border border-brandTeal px-2.5 py-1 text-xs font-bold text-midnight hover:bg-brandTeal/10"
    >
      {label}
    </a>
  );
}

/** One marker per date. Holiday styling when every note on that date is a holiday. */
function NoteMarker({ notes, x }: { notes: ChartNote[]; x: number }) {
  const holiday = notes.every((note) => note.readOnly);
  const label = notes.map((note) => `${note.readOnly ? "Holiday: " : ""}${note.title}`).join("; ");
  return (
    <span className="group absolute top-0 -translate-x-1/2" style={{ left: x }}>
      <button
        type="button"
        aria-label={`${notes[0].date}: ${label}`}
        title={label}
        className={
          holiday
            ? "block h-3 w-3 rounded-full border-2 border-dashed border-brandTeal bg-white"
            : "block h-3 w-3 rounded-full bg-midnight"
        }
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md bg-midnight px-2 py-1 text-xs text-white group-hover:block group-focus-within:block"
      >
        {notes.map((note) => (
          <span key={note.id} className="block">
            {note.readOnly ? "Holiday: " : ""}
            {note.title}
          </span>
        ))}
      </span>
    </span>
  );
}
