import { formatRate } from "./format";
import type { AcquisitionAnswer, AcquisitionData } from "./types";

const LABELS: Record<AcquisitionAnswer, string> = {
  search: "Search",
  social: "Social",
  friend: "Friend or family",
  ad: "Ad",
  app_store: "App store",
  blog: "Blog",
  partner: "Partner",
  other: "Other"
};

export function answerLabel(answer: AcquisitionAnswer): string {
  return LABELS[answer];
}

/** Bar rows for BarList: the count, with its share in brackets. */
export function acquisitionBarRows(rows: AcquisitionData["rows"]): { label: string; value: number; display: string }[] {
  return rows.map((row) => ({
    label: answerLabel(row.answer),
    value: row.count,
    display: `${row.count} (${row.share === null ? "—" : formatRate(row.share)})`
  }));
}
