import type { SeoPageFaq } from "@/content/seo-pages";
import type { DestinationPlanRow } from "@/lib/destinationPricing";
import type { DestinationOfferInput } from "@/lib/seo";

/**
 * The answer-first FAQ for a destination page ("Does eSIM2you work in X?"),
 * built from the live plans the page renders, so AI answer engines and
 * snippets can quote one self-contained, true sentence. No live plans → null:
 * the page must never claim coverage it can't show.
 */
// Destination names that read as "in the UK", not "in UK".
const NAMES_WITH_ARTICLE = new Set(["Balkans", "Middle East", "Netherlands", "UAE", "UK", "USA"]);

export function destinationAnswerFaq({
  countryName,
  plans,
  offer
}: {
  countryName: string;
  plans: DestinationPlanRow[];
  offer?: DestinationOfferInput;
}): SeoPageFaq | null {
  if (!offer || plans.length === 0) return null;

  const place = NAMES_WITH_ARTICLE.has(countryName) ? `the ${countryName}` : countryName;

  const count = offer.offerCount;
  const days = plans.map((plan) => plan.durationDays).filter((value) => value > 0);
  const minDays = Math.min(...days);
  const maxDays = Math.max(...days);
  const validity =
    days.length === 0
      ? ""
      : minDays === maxDays
        ? `, valid ${minDays} ${minDays === 1 ? "day" : "days"}`
        : `, valid ${minDays} to ${maxDays} days`;

  return {
    question: `Does eSIM2you work in ${place}?`,
    answer:
      `Yes. eSIM2you sells ${count} prepaid travel eSIM data ${count === 1 ? "plan" : "plans"} for ${place}, ` +
      `from €${offer.lowPrice.toFixed(2)}${validity}. ` +
      "Install the eSIM before you travel and turn on its data line when you arrive."
  };
}
