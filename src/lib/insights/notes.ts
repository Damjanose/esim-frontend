import type { ChartNote } from "./types";

/** Notes grouped by their YYYY-MM-DD date, in the order given. */
export function notesByDate(notes: ChartNote[]): Record<string, ChartNote[]> {
  const grouped: Record<string, ChartNote[]> = {};
  for (const note of notes) {
    (grouped[note.date] ??= []).push(note);
  }
  return grouped;
}

/** The x index of each note on a daily chart whose points are `days`. Notes outside the days are left out. */
export function notePositions(notes: ChartNote[], days: string[]): { note: ChartNote; index: number }[] {
  return notes.flatMap((note) => {
    const index = days.indexOf(note.date);
    return index === -1 ? [] : [{ note, index }];
  });
}

/** One marker per date that has notes, with every note for that date. Dates outside `days` are left out. */
export function noteMarkers(notes: ChartNote[], days: string[]): { date: string; index: number; notes: ChartNote[] }[] {
  const grouped = notesByDate(notes);
  return days.flatMap((date, index) => (grouped[date] ? [{ date, index, notes: grouped[date] }] : []));
}
