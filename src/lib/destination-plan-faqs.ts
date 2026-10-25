import type { SeoPageFaq } from "@/content/seo-pages";
import { destinationPlace } from "@/lib/destination-answer";
import type { DestinationPlanRow } from "@/lib/destinationPricing";

const UNLIMITED_GB = 999;

export type RegionalPlanMatch = {
  /** Display name of the regional hub, e.g. "Europe". */
  hubName: string;
  lowPrice: number;
  countryCount: number;
};

function dayList(days: number[]) {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const words = sorted.map(String);
  const list = words.length > 1 ? `${words.slice(0, -1).join(", ")} or ${words.at(-1)}` : words[0];
  return `${list} ${sorted.at(-1) === 1 ? "day" : "days"}`;
}

/** "7 days" from durationDays; the backend's durationLabel reads "7 Days Duration". */
function planDays(plan: DestinationPlanRow) {
  if (plan.durationDays <= 0) return plan.durationLabel;
  return `${plan.durationDays} ${plan.durationDays === 1 ? "day" : "days"}`;
}

/**
 * Country-specific FAQs for a generated /esim/<slug> page, built only from the
 * live plans the page renders (and, when the regional hub's plans cover the
 * country, that hub's live offer). No plans → no FAQs: never claim what the
 * page can't show. Answers name prices in EUR because checkout charges EUR.
 */
export function destinationPlanFaqs({
  countryName,
  plans,
  regional
}: {
  countryName: string;
  plans: DestinationPlanRow[];
  regional?: RegionalPlanMatch;
}): SeoPageFaq[] {
  if (plans.length === 0) return [];

  const place = destinationPlace(countryName);
  const faqs: SeoPageFaq[] = [];
  const cheapest = plans[0];

  faqs.push({
    question: `What is the cheapest eSIM for ${place}?`,
    answer:
      `The lowest-priced ${countryName} plan on eSIM2you right now is ${cheapest.dataLabel} for ${planDays(cheapest)} ` +
      `at ${cheapest.price}. Larger data plans are listed in the plan table above.`
  });

  const days = plans.map((plan) => plan.durationDays).filter((value) => value > 0);
  if (days.length > 0) {
    faqs.push({
      question: `How long do ${countryName} eSIM plans last?`,
      answer:
        `${countryName} plans on this page are valid for ${dayList(days)}. ` +
        "Pick a plan whose validity covers your whole stay."
    });
  }

  const sizes = plans.map((plan) => plan.dataNumericGb).filter((value) => value > 0);
  if (sizes.length > 0) {
    const unlimited = plans.find((plan) => plan.dataNumericGb >= UNLIMITED_GB);
    const largest = Math.max(...sizes.filter((value) => value < UNLIMITED_GB), 0);
    faqs.push({
      question: `Is there an unlimited data eSIM for ${place}?`,
      answer: unlimited
        ? `Yes. An unlimited ${countryName} plan is listed above: ${unlimited.title} at ${unlimited.price}.`
        : `Not at the moment. The ${countryName} plans listed here go up to ${largest} GB, ` +
          "and you can buy a second plan if you run out."
    });
  }

  const withVoice = plans.find((plan) => plan.voiceMinutes || plan.smsCount);
  faqs.push({
    question: `Does the ${countryName} eSIM include calls and texts?`,
    answer: withVoice
      ? `Some plans do. For example, ${withVoice.title} costs ${withVoice.price}. The other ${countryName} plans are data-only, ` +
        "so use WhatsApp or FaceTime over data for calls."
      : `No. ${countryName} plans are data-only. Keep your usual SIM on for calls and texts, ` +
        "or call over data with WhatsApp or FaceTime."
  });

  if (regional) {
    faqs.push({
      question: `Can one eSIM cover ${place} and nearby countries?`,
      answer:
        `Yes. eSIM2you's ${regional.hubName} regional plans cover ${place} and ${regional.countryCount - 1} other countries ` +
        `on one eSIM, from €${regional.lowPrice.toFixed(2)}. They suit trips that cross borders.`
    });
  }

  return faqs;
}
