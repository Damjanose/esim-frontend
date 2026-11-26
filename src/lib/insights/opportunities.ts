import type { OpportunityCard, OpportunityRule } from "./types";

export type OpportunityTone = "money" | "conversion" | "risk" | "timing";

/** Icon name (lucide) and colour tone per rule. */
export const OPPORTUNITY_STYLE: Record<OpportunityRule, { icon: string; tone: OpportunityTone }> = {
  campaign_unprofitable: { icon: "trending-down", tone: "money" },
  payment_method_failing: { icon: "credit-card", tone: "money" },
  destination_low_conversion: { icon: "map-pin", tone: "conversion" },
  region_high_conversion_low_traffic: { icon: "trending-up", tone: "conversion" },
  zero_result_search: { icon: "search-x", tone: "risk" },
  best_hours: { icon: "clock", tone: "timing" }
};

/** Money rules come first, then the rest in this order. */
const RULE_ORDER: OpportunityRule[] = [
  "campaign_unprofitable",
  "payment_method_failing",
  "destination_low_conversion",
  "region_high_conversion_low_traffic",
  "zero_result_search",
  "best_hours"
];

export function opportunityStyle(rule: OpportunityRule): { icon: string; tone: OpportunityTone } {
  return OPPORTUNITY_STYLE[rule];
}

/** Stable sort: by rule order, then by the order the backend sent. */
export function sortOpportunityCards(cards: OpportunityCard[]): OpportunityCard[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => RULE_ORDER.indexOf(a.card.rule) - RULE_ORDER.indexOf(b.card.rule) || a.index - b.index)
    .map(({ card }) => card);
}

export const OPPORTUNITY_FOOTER =
  "Suggestions from fixed rules. They show a pattern, not a proven cause. Nothing is sent or changed automatically.";

export function belowSampleText(minSample: number): string {
  return `Not enough data yet (needs ${minSample} visitors)`;
}

/** Text colour per tone, from the shared palette tokens. */
export function opportunityToneClass(tone: OpportunityTone): string {
  const classes: Record<OpportunityTone, string> = {
    money: "text-red-700",
    conversion: "text-brandBlue",
    risk: "text-amber-700",
    timing: "text-brandTeal"
  };
  return classes[tone];
}
