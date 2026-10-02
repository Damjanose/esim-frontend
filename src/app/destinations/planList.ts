import { isUnlimitedPlan } from "@/lib/planRow";
import type { HeroPackageOption } from "@/services/packages";

/** The live view's filter chips and sort options (moved out of DestinationPlans unchanged). */
export type PlanFilter = "all" | "unlimited" | "fixed" | "short" | "medium" | "long";
export type PlanSort = "recommended" | "price-low" | "price-high" | "duration";

export const PLAN_FILTERS: ReadonlyArray<{ value: PlanFilter; label: string }> = [
  { value: "all", label: "All plans" },
  { value: "unlimited", label: "Unlimited" },
  { value: "fixed", label: "Fixed data" },
  { value: "short", label: "1–7 days" },
  { value: "medium", label: "8–15 days" },
  { value: "long", label: "16+ days" },
];

export const PLAN_SORTS: ReadonlyArray<{ value: PlanSort; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "duration", label: "Longest validity" },
];

/** "Recommended" order: GB per euro, or days per euro for unlimited plans. */
export function planValueScore(plan: HeroPackageOption): number {
  if (plan.priceNumeric <= 0) return 0;
  if (isUnlimitedPlan(plan)) return Math.max(plan.durationDays, 1) / plan.priceNumeric;
  return Math.max(plan.dataNumericGb, 0.1) / plan.priceNumeric;
}

function matchesFilter(plan: HeroPackageOption, filter: PlanFilter): boolean {
  switch (filter) {
    case "unlimited":
      return isUnlimitedPlan(plan);
    case "fixed":
      return !isUnlimitedPlan(plan);
    case "short":
      return plan.durationDays > 0 && plan.durationDays <= 7;
    case "medium":
      return plan.durationDays > 7 && plan.durationDays <= 15;
    case "long":
      return plan.durationDays > 15;
    default:
      return true;
  }
}

function compare(first: HeroPackageOption, second: HeroPackageOption, sort: PlanSort): number {
  switch (sort) {
    case "price-low":
      return first.priceNumeric - second.priceNumeric;
    case "price-high":
      return second.priceNumeric - first.priceNumeric;
    case "duration":
      return second.durationDays - first.durationDays;
    default:
      return planValueScore(second) - planValueScore(first);
  }
}

/**
 * The plan list as displayed. Its first row is the list's Best value
 * (planRowTags position 0), as FeaturedPlan was before.
 */
export function visiblePlans(
  plans: readonly HeroPackageOption[],
  filter: PlanFilter,
  sort: PlanSort,
): HeroPackageOption[] {
  return plans.filter((plan) => matchesFilter(plan, filter)).sort((first, second) => compare(first, second, sort));
}
