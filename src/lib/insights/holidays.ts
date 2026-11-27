import { dayCount, shiftDays } from "./query";
import type { ChartNote } from "./types";

/** How far ahead the Daily trend lists upcoming holidays. */
export const UPCOMING_HOLIDAY_DAYS = 90;

export type UpcomingHoliday = {
  id: string;
  date: string;
  title: string;
  /** Days from today: 0 is today. */
  daysAway: number;
  /** Country names to plan a discount for. Empty means worldwide. */
  markets: string[];
};

/** The window the upcoming list asks the chart-notes endpoint for: today and the next 90 days. */
export function upcomingHolidayRange(today: string): { from: string; to: string } {
  return { from: today, to: shiftDays(today, UPCOMING_HOLIDAY_DAYS) };
}

/** Built-in holidays (never admin notes) from today on, soonest first. */
export function upcomingHolidays(notes: ChartNote[], today: string): UpcomingHoliday[] {
  return notes
    .filter((note) => note.readOnly && note.date >= today)
    .map((note) => ({
      id: note.id,
      date: note.date,
      title: note.title,
      daysAway: dayCount(today, note.date) - 1,
      markets: note.markets ?? []
    }))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
}

export function formatDaysAway(daysAway: number): string {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  return `In ${daysAway} days`;
}

/** The pricing page, searched for one market's packages, or every package for a worldwide date. */
export function pricingHref(market?: string): string {
  return market ? `/xpricing?${new URLSearchParams({ q: market }).toString()}` : "/xpricing";
}
