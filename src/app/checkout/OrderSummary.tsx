"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Globe2, Lock } from "lucide-react";
import {
  PAYMENT_TRUST_NOTE,
  checkoutPriceLines,
  checkoutTotal,
  coverageCountries,
  orderSummaryToggleLabel,
} from "@/lib/checkoutSummary";
import { planDurationText, planRowTags, planVoiceSmsDetail } from "@/lib/planRow";
import type { HeroPackageOption } from "@/services/packages";
import { PlanDataDisc, PlanTags } from "@/app/components/PlanRow";
import { PromoCodeField, type AppliedPromo } from "./PromoCodeField";

/**
 * ISO 3166-1 alpha-2 -> flag emoji, via the regional-indicator-symbol trick
 * (each letter maps to the Unicode codepoint 0x1F1E6 + its offset from 'A').
 * Falls back to the globe glyph for anything that isn't a plain two-letter
 * code (Airalo's `countryCode` is always alpha-2 for real countries).
 */
function flagEmoji(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)));
}

const PANEL_ID = "checkout-order-summary";

/**
 * The checkout's one order summary (spec option B). There is exactly one
 * instance, so PromoCodeField mounts once and its stored-code check runs once:
 * - below lg: a "Show order summary · €X" bar that expands the panel in place;
 * - lg+: the bar hides and the panel is always open, sticky in the right column.
 * `hidden` (display:none) keeps the collapsed panel mounted, so a stored partner
 * code is still re-checked on phones before Pay is enabled.
 */
export function OrderSummary({
  plan,
  promo,
  promoPending,
  onPromoChange,
  onPromoPendingChange,
  className = "",
}: {
  plan: HeroPackageOption;
  promo: AppliedPromo | null;
  promoPending: boolean;
  onPromoChange: (promo: AppliedPromo | null) => void;
  onPromoPendingChange: (pending: boolean) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [countriesExpanded, setCountriesExpanded] = useState(false);
  const [flagFailed, setFlagFailed] = useState(false);

  const total = checkoutTotal(plan, promo, promoPending);
  const lines = checkoutPriceLines(plan, promo);
  const planCountries = coverageCountries(plan.countries);
  const voiceSms = planVoiceSmsDetail(plan);
  // Not in a list, so no "Best value": just the discount and Calls + SMS tags.
  const tags = planRowTags(plan, { position: null });

  return (
    <aside aria-label="Order summary" className={`min-w-0 lg:sticky lg:top-6 lg:self-start ${className}`}>
      <button
        aria-controls={PANEL_ID}
        aria-expanded={expanded}
        className="flex h-14 w-full items-center justify-between gap-3 rounded-[16px] border border-outline/70 bg-surfaceBright px-4 text-left text-sm font-bold text-brandBlue transition hover:border-brandBlue/40 lg:hidden"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        <span className="min-w-0 truncate">{orderSummaryToggleLabel(expanded, total)}</span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 motion-safe:transition-transform ${expanded ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      <div
        className={`${expanded ? "mt-3 block" : "hidden"} rounded-[24px] border border-outline/70 bg-surfaceBright p-4 sm:p-6 lg:mt-0 lg:block`}
        id={PANEL_ID}
      >
        <h2 className="sr-only lg:not-sr-only lg:mb-4 lg:text-xs lg:font-bold lg:uppercase lg:tracking-[0.14em] lg:text-onSurfaceVariant">
          Order summary
        </h2>

        <div className="flex items-center gap-3">
          {plan.flagUri && !flagFailed ? (
            <img
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-outline/60 object-cover"
              height={44}
              onError={() => setFlagFailed(true)}
              src={plan.flagUri}
              width={44}
            />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-outline/60 bg-surface text-brandBlue">
              <Globe2 aria-hidden="true" size={20} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-black text-brandInk">{plan.country}</p>
            <p className="truncate text-body-sm text-onSurfaceVariant">{plan.title}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-outline/60 bg-surface p-3">
          <PlanDataDisc plan={plan} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-title-sm font-black text-brandInk">{planDurationText(plan)}</p>
            {voiceSms ? <p className="truncate text-body-sm text-onSurfaceVariant">{voiceSms}</p> : null}
            <PlanTags className="mt-1" tags={tags} />
          </div>
        </div>

        {planCountries.length > 0 ? (
          <div className="mt-3">
            <button
              aria-expanded={countriesExpanded}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[12px] bg-brandBlue/10 px-3 text-[13px] font-bold text-brandBlue transition-colors hover:bg-brandBlue/15"
              onClick={() => setCountriesExpanded((value) => !value)}
              type="button"
            >
              <span className="min-w-0 truncate">
                {plan.country} covers {planCountries.length} countries
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`shrink-0 motion-safe:transition-transform ${countriesExpanded ? "rotate-180" : ""}`}
                size={16}
              />
            </button>
            {countriesExpanded ? (
              <div className="relative -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                {planCountries.map((country) => (
                  <span
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-outline/60 bg-surface px-2.5 py-1 text-[12px] text-brandInk"
                    key={country.countryCode}
                  >
                    <span aria-hidden="true">{flagEmoji(country.countryCode)}</span>
                    {country.title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 border-t border-outline/70 pt-5">
          <PromoCodeField onChange={onPromoChange} onPendingChange={onPromoPendingChange} packageId={plan.id} />
        </div>

        <dl className="mt-5 space-y-2 border-t border-outline/70 pt-5 text-sm">
          {lines.map((line) => (
            <div className="flex items-center justify-between gap-4" key={line.kind}>
              <dt className="text-onSurfaceVariant">{line.label}</dt>
              <dd className={`font-bold ${line.kind === "plan" ? "text-brandInk" : "text-brandBlue"}`}>{line.value}</dd>
            </div>
          ))}
          <div className="flex items-end justify-between gap-4 border-t border-outline/70 pt-3">
            <dt className="font-bold text-brandInk">Total</dt>
            <dd className="font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
              {total ?? (
                <span
                  aria-hidden="true"
                  className="inline-block h-8 w-24 rounded-md bg-outline/40 align-middle motion-safe:animate-pulse"
                />
              )}
            </dd>
          </div>
        </dl>

        <p className="mt-5 hidden items-start gap-2 text-body-sm text-onSurfaceVariant lg:flex">
          <Lock aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={15} />
          {PAYMENT_TRUST_NOTE}
        </p>

        <p className="mt-4 text-center text-xs text-onSurfaceVariant">
          Changed your mind?{" "}
          <Link className="font-semibold text-brandBlue hover:text-brandInk" href="/destinations">
            Browse other destinations
          </Link>
        </p>
      </div>
    </aside>
  );
}
