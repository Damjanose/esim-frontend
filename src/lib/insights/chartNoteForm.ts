import { CHART_NOTE_KINDS, type ChartNoteKind } from "./types";

export type ChartNoteFormInput = { date: string; kind: string; title: string };
export type ChartNoteFormValue = { date: string; kind: ChartNoteKind; title: string };
export type ChartNoteFormResult =
  | { ok: true; value: ChartNoteFormValue }
  | { ok: false; errors: Partial<Record<"date" | "kind" | "title", string>> };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(text: string): boolean {
  if (!DATE.test(text)) return false;
  const time = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === text;
}

/** Mirrors the backend rules for a chart note (plan §1.2): a real date, a known kind, a 1-80 character title without HTML. */
export function validateChartNoteForm(input: ChartNoteFormInput): ChartNoteFormResult {
  const errors: Partial<Record<"date" | "kind" | "title", string>> = {};
  if (!isRealDate(input.date)) errors.date = "Pick a real date.";
  if (!(CHART_NOTE_KINDS as readonly string[]).includes(input.kind)) errors.kind = "Pick a kind.";
  const title = input.title.replace(/<[^>]*>/g, "").trim();
  if (title.length < 1 || title.length > 80) errors.title = "Enter a title of 1 to 80 characters.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { date: input.date, kind: input.kind as ChartNoteKind, title } };
}
