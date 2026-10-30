import type { DestinationPlanRow } from "./destinationPricing";
import { planDurationText } from "./planRow";

/** The catalog marks unlimited plans with a data size at or above this (as destinationPricing does). */
const UNLIMITED_GB = 999;

type PlanSummary = Pick<DestinationPlanRow, "dataLabel" | "durationLabel" | "priceNumeric">;

export type ComparePriceRow = {
  cheapest: PlanSummary;
  bestPerGb: (PlanSummary & { pricePerGb: number }) | null;
  cheapestUnlimited: PlanSummary | null;
  /** Shortest and longest validity in days, or null when no plan states one. */
  validityDays: [number, number] | null;
};

function isUnlimited(plan: DestinationPlanRow): boolean {
  return plan.dataNumericGb >= UNLIMITED_GB;
}

function summary(plan: DestinationPlanRow): PlanSummary {
  // "7 days" rather than the catalog's "7 Days Duration".
  return { dataLabel: plan.dataLabel, durationLabel: planDurationText(plan), priceNumeric: plan.priceNumeric };
}

/**
 * One /compare price-per-GB row from a destination's live plans. Price per GB
 * uses fixed-data plans only; unlimited plans are reported separately.
 */
export function comparePriceRow(plans: DestinationPlanRow[]): ComparePriceRow | null {
  if (plans.length === 0) return null;

  const byPrice = [...plans].sort((a, b) => a.priceNumeric - b.priceNumeric);
  const bestPerGb = plans
    .filter((plan) => plan.dataNumericGb > 0 && !isUnlimited(plan))
    .map((plan) => ({ ...summary(plan), pricePerGb: plan.priceNumeric / plan.dataNumericGb }))
    .sort((a, b) => a.pricePerGb - b.pricePerGb)[0];
  const cheapestUnlimited = byPrice.find(isUnlimited);
  const days = plans.map((plan) => plan.durationDays).filter((value) => value > 0);

  return {
    cheapest: summary(byPrice[0]),
    bestPerGb: bestPerGb ?? null,
    cheapestUnlimited: cheapestUnlimited ? summary(cheapestUnlimited) : null,
    validityDays: days.length > 0 ? [Math.min(...days), Math.max(...days)] : null
  };
}

export function formatValidityRange([min, max]: [number, number]): string {
  if (min === max) return `${min} ${min === 1 ? "day" : "days"}`;
  return `${min}–${max} days`;
}
