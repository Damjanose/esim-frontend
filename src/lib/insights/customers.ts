import type { Rate } from "./types";

/** "unknown" when there is no median yet, never 0. */
export function formatMedianDays(days: number | null): string {
  if (days === null) return "unknown";
  return days === 1 ? "1 day" : `${days} days`;
}

/** Share of a cohort's buyers who bought again. Null for an empty cohort. */
export function cohortRepeatRate(cohort: { buyers: number; repeatBuyers: number }): Rate {
  return cohort.buyers > 0 ? cohort.repeatBuyers / cohort.buyers : null;
}
