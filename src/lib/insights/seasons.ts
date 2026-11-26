import type { ChartNote } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11" → "Nov 2026". */
export function monthLabel(month: string): string {
  const [year, number] = month.split("-");
  return `${MONTHS[Number(number) - 1]} ${year}`;
}

/** Notes grouped by their YYYY-MM month, in the order given. */
export function groupNotesByMonth(notes: ChartNote[]): Record<string, ChartNote[]> {
  const grouped: Record<string, ChartNote[]> = {};
  for (const note of notes) {
    (grouped[note.date.slice(0, 7)] ??= []).push(note);
  }
  return grouped;
}

/** Each month's bar height as a share of the busiest month, 0 to 1. All 0 when no month has orders. */
export function monthBarHeights(months: { orders: number }[]): number[] {
  const max = Math.max(0, ...months.map((month) => month.orders));
  return months.map((month) => (max > 0 ? month.orders / max : 0));
}
