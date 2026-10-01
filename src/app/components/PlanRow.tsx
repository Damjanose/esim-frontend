import { ArrowRight } from "lucide-react";
import {
  hasBestValueTag,
  planDataDisc,
  planDurationText,
  planSubtitle,
  type PlanRowPlan,
  type PlanRowTag,
} from "@/lib/planRow";
import { formatOriginalPrice, hasActiveDiscount } from "@/services/discountPricing";
import { LinkButton } from "./Button";

/**
 * The app's CountryPlanRow at web scale, plus the pieces the /esim plan table
 * reuses cell by cell. No hooks and no client directive: it renders on the server
 * (/esim, /pkg) and inside DestinationPlans alike.
 */

const TAG_CLASSES: Record<PlanRowTag["kind"], string> = {
  "best-value": "bg-brandBlue text-surface",
  discount: "bg-error/10 text-error",
  "calls-sms": "bg-brandTeal/15 text-brandInk",
};

/** GB number in brandBlue, unit in onSurfaceVariant (teal fails contrast on the light disc), ∞ + UNL for unlimited. Screen readers get the data label. */
export function PlanDataDisc({ plan }: { plan: PlanRowPlan }) {
  const disc = planDataDisc(plan);

  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-brandBlue/15 bg-brandBlue/5 sm:h-16 sm:w-16">
      <span aria-hidden="true" className="flex max-w-full flex-col items-center px-1 leading-none">
        <span
          className={`max-w-full truncate font-display font-black text-brandBlue ${
            disc.unlimited ? "text-2xl sm:text-[28px]" : "text-base sm:text-xl"
          }`}
        >
          {disc.value}
        </span>
        {disc.unit ? (
          <span className="mt-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-onSurfaceVariant sm:text-[10px]">
            {disc.unit}
          </span>
        ) : null}
      </span>
      <span className="sr-only">{plan.dataLabel}</span>
    </span>
  );
}

export function PlanTags({ tags, className = "" }: { tags: readonly PlanRowTag[]; className?: string }) {
  if (tags.length === 0) return null;

  return (
    <span className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-1.5 text-[10px] font-black uppercase tracking-[0.04em] ${TAG_CLASSES[tag.kind]}`}
          key={tag.kind}
        >
          {tag.label}
        </span>
      ))}
    </span>
  );
}

/** Strike-through original price while a discount is active (f078), then the charged price. */
export function PlanPrice({ plan }: { plan: PlanRowPlan }) {
  return (
    <span className="flex flex-col items-end">
      {hasActiveDiscount(plan) ? (
        <span className="text-xs font-semibold text-onSurfaceVariant line-through">{formatOriginalPrice(plan)}</span>
      ) : null}
      <span className="whitespace-nowrap font-display text-lg font-black leading-tight text-brandInk sm:text-xl">
        {plan.price}
      </span>
    </span>
  );
}

/** "Buy now": the list's best-value row is its one gradient primary, every other row is flat. */
export function PlanBuyLink({ href, primary, planTitle }: { href: string; primary: boolean; planTitle: string }) {
  return (
    <LinkButton
      aria-label={`Buy now: ${planTitle}`}
      className="whitespace-nowrap"
      href={href}
      size="md"
      variant={primary ? "primary" : "flat"}
    >
      Buy now
      <ArrowRight aria-hidden="true" className="hidden sm:block" size={16} />
    </LinkButton>
  );
}

type PlanRowProps = {
  plan: PlanRowPlan;
  /** planRowTags(plan, { position }). A "Best value" tag makes this row's Buy now the gradient one. */
  tags: readonly PlanRowTag[];
  /** Buy now target. Omit it to show the plan without a CTA (/pkg keeps its own actions). */
  buyHref?: string;
};

export function PlanRow({ plan, tags, buyHref }: PlanRowProps) {
  const bestValue = hasBestValueTag(tags);

  return (
    <article
      className={`relative flex items-center gap-3 rounded-[18px] border bg-surface p-3 sm:gap-4 sm:p-4 ${
        bestValue ? "border-brandBlue/40 shadow-brandGlow" : "border-outline/70"
      }`}
    >
      <PlanDataDisc plan={plan} />

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-title-sm font-black text-brandInk sm:text-lg">{planDurationText(plan)}</h2>
        <PlanTags className="mt-1" tags={tags} />
        <p className="mt-1 truncate text-body-sm text-onSurfaceVariant">{planSubtitle(plan)}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <PlanPrice plan={plan} />
        {buyHref ? <PlanBuyLink href={buyHref} planTitle={plan.title} primary={bestValue} /> : null}
      </div>
    </article>
  );
}
