import { discountPercentOff, type DiscountPricedPlan } from "@/services/discountPricing";

/**
 * Pure presentation rules for a plan row (PlanRow, the /esim plan table, /pkg).
 * The live catalog's HeroPackageOption and the static /esim DestinationPlanRow
 * both satisfy PlanRowPlan.
 */
export type PlanRowPlan = DiscountPricedPlan & {
  id: string;
  title: string;
  dataLabel: string;
  durationLabel: string;
  dataNumericGb?: number;
  durationDays?: number;
  voiceMinutes?: number;
  smsCount?: number;
  /** Live catalog only: "local" / "regional" / "global" geography filters and the plan's own destination name. */
  filters?: readonly string[];
  country?: string;
};

export type PlanRowTag =
  | { kind: "best-value"; label: string }
  | { kind: "discount"; label: string }
  | { kind: "calls-sms"; label: string };

export type PlanDataDisc = { unlimited: boolean; value: string; unit: string };

/** The catalog's "unlimited" sentinel (mobile UNLIMITED_DATA_GB). */
const UNLIMITED_DATA_GB = 999;

/** Same rule DestinationPlans used for its Unlimited / Fixed data filters and icons. */
export function isUnlimitedPlan(plan: Pick<PlanRowPlan, "dataLabel" | "title" | "dataNumericGb">): boolean {
  return (
    (plan.dataNumericGb ?? 0) >= UNLIMITED_DATA_GB ||
    plan.dataLabel.toLowerCase().includes("unlimited") ||
    plan.title.toLowerCase().includes("unlimited")
  );
}

/**
 * The row's tags, in display order.
 * - "Best value": the first row of the list as displayed (position 0). That's
 *   the rule both surfaces already used: the live view headlined
 *   visiblePlans[0] as FeaturedPlan with a "Best value" badge, and /esim names
 *   plans[0] its "Best value starting point". Outside a list (null) there's none.
 * - "-N%": discountPercentOff, so a markup (hasDiscount with a higher price) gets no badge (f078).
 * - "Calls + SMS": the plan includes minutes or texts.
 */
export function planRowTags(plan: PlanRowPlan, context: { position: number | null }): PlanRowTag[] {
  const tags: PlanRowTag[] = [];
  if (context.position === 0) tags.push({ kind: "best-value", label: "Best value" });

  const percentOff = discountPercentOff(plan);
  if (percentOff != null) tags.push({ kind: "discount", label: `-${percentOff}%` });

  if (plan.voiceMinutes || plan.smsCount) tags.push({ kind: "calls-sms", label: "Calls + SMS" });
  return tags;
}

/** The best-value row carries the list's single gradient Buy now; every other row is flat. */
export function hasBestValueTag(tags: readonly PlanRowTag[]): boolean {
  return tags.some((tag) => tag.kind === "best-value");
}

/** The data disc: "1" + "GB", "500" + "MB", or "∞" + "UNL". */
export function planDataDisc(plan: Pick<PlanRowPlan, "dataLabel" | "title" | "dataNumericGb">): PlanDataDisc {
  if (isUnlimitedPlan(plan)) return { unlimited: true, value: "∞", unit: "UNL" };

  const match = plan.dataLabel.trim().match(/^(\d+(?:[.,]\d+)?)\s*(GB|MB|TB)$/i);
  if (match) return { unlimited: false, value: match[1], unit: match[2].toUpperCase() };

  const gb = plan.dataNumericGb ?? 0;
  if (gb > 0 && gb < 1) return { unlimited: false, value: String(Math.round(gb * 1024)), unit: "MB" };
  if (gb >= 1) return { unlimited: false, value: String(Number(gb.toFixed(2))), unit: "GB" };
  return { unlimited: false, value: plan.dataLabel, unit: "" };
}

/** "7 days" from durationDays, else the backend label without its " Duration" suffix. */
export function planDurationText(plan: Pick<PlanRowPlan, "durationDays" | "durationLabel">): string {
  const days = plan.durationDays ?? 0;
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"}`;
  return plan.durationLabel.replace(/\s*Duration\s*$/i, "");
}

/** "75 min + 30 SMS", or null on a data-only plan. */
export function planVoiceSmsDetail(plan: Pick<PlanRowPlan, "voiceMinutes" | "smsCount">): string | null {
  const parts = [
    plan.voiceMinutes ? `${plan.voiceMinutes} min` : null,
    plan.smsCount ? `${plan.smsCount} SMS` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" + ") : null;
}

/** The row's second line: its minutes/texts, else the old CompactPlanCard line. */
export function planSubtitle(plan: PlanRowPlan): string {
  const voiceSms = planVoiceSmsDetail(plan);
  if (voiceSms) return voiceSms;
  if (isUnlimitedPlan(plan)) return "High-speed data without limits.";
  return (plan.durationDays ?? 0) <= 15 ? "Perfect for short trips." : "More data for longer adventures.";
}

/**
 * For a regional or global bundle listed under a country, the bundle's own
 * coverage name ("European Union and United Kingdom"). Without it, a bundle and
 * a local plan with the same data and days look identical. Null for local plans
 * and when the catalog didn't say (static /esim rows carry no filters).
 */
export function planCoverageNote(plan: Pick<PlanRowPlan, "filters" | "country">): string | null {
  if (!plan.filters || plan.filters.length === 0 || plan.filters.includes("local")) return null;
  const country = plan.country?.trim();
  return country ? country : null;
}
