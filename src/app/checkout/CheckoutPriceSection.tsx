"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronDown, Database, Globe2, Phone } from "lucide-react";
import { discountPercentOff, formatOriginalPrice, formatPriceFromCents, hasActiveDiscount } from "@/services/discountPricing";
import type { HeroPackageOption } from "@/services/packages";
import { CheckoutWizard } from "./CheckoutWizard";
import { PromoCodeField, type AppliedPromo } from "./PromoCodeField";

/**
 * The `plan.hasDiscount`/`retailPrice` fields describe an admin-set retail
 * discount already baked into `plan.price` — a different mechanism from a
 * partner promo code applied at checkout. When a promo is applied we trust
 * `finalCustomerPriceCents` from the backend outright (it already accounts
 * for whatever admin discount was in effect) and swap it in as the total,
 * rather than trying to recompute/stack the two client-side. The admin
 * discount's strikethrough/badge still shows above it for context.
 */
type CountryOption = { code: string; name: string };

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

export function CheckoutPriceSection({
  plan,
  accountEmail,
  countries
}: {
  plan: HeroPackageOption;
  accountEmail: string | null;
  countries: CountryOption[];
}) {
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  // Tracks whether a promo-apply request (manual, or the silent on-mount
  // re-validation of a stored code) is currently in flight. Used to both
  // gate Pay (so a payment can't be created while the promo state is
  // unsettled) and to avoid flashing the full price before a stored code's
  // discount is confirmed.
  const [promoPending, setPromoPending] = useState(false);
  const [countriesExpanded, setCountriesExpanded] = useState(false);
  const planCountries = plan.countries ?? [];

  const displayPrice = promoPending
    ? null
    : promo
      ? formatPriceFromCents(plan, promo.finalCustomerPriceCents)
      : plan.price;

  const rows = [
    { icon: Database, label: "Data", value: plan.dataLabel },
    { icon: CalendarClock, label: "Validity", value: plan.durationLabel },
    ...(plan.voiceMinutes || plan.smsCount
      ? [
          {
            icon: Phone,
            label: "Voice & SMS",
            value: [
              plan.voiceMinutes ? `${plan.voiceMinutes} min` : null,
              plan.smsCount ? `${plan.smsCount} SMS` : null
            ]
              .filter(Boolean)
              .join(" + ")
          }
        ]
      : [])
  ];

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-16">
      <div className="min-w-0 order-2 lg:order-1">
        <CheckoutWizard
          accountEmail={accountEmail}
          countries={countries}
          disabled={promoPending}
          packageId={plan.id}
          promoCode={promo?.promoCode ?? null}
        />
      </div>

      <aside className="order-1 lg:sticky lg:top-28 lg:order-2">
        <div className="flex items-center gap-4 border-b border-outline/70 pb-5">
          {plan.flagUri ? (
            <img alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" src={plan.flagUri} />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-outline bg-mist text-brandBlue">
              <Globe2 size={20} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-black text-brandInk">{plan.country}</p>
            <p className="truncate text-xs text-onSurfaceVariant">{plan.title}</p>
          </div>
        </div>

        <dl className="border-b border-outline/70 py-4">
          <div className="flex items-center justify-between gap-4 py-1.5">
            <dt className="flex items-center gap-2 text-[13px] text-onSurfaceVariant">
              <Globe2 aria-hidden="true" className="text-brandBlue" size={15} />
              Destination
            </dt>
            <dd className="text-[13px] font-bold text-brandInk">
              {planCountries.length === 0 ? plan.country : null}
            </dd>
          </div>
          {planCountries.length > 0 ? (
            <button
              aria-expanded={countriesExpanded}
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-brandBlue/10 px-3 py-2 text-[13px] font-bold text-brandBlue transition-colors hover:bg-brandBlue/15"
              onClick={() => setCountriesExpanded((v) => !v)}
              type="button"
            >
              <span>
                {plan.country} covers {planCountries.length} countries
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`shrink-0 transition-transform ${countriesExpanded ? "rotate-180" : ""}`}
                size={16}
              />
            </button>
          ) : null}
          {countriesExpanded && planCountries.length > 0 ? (
            <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
              {planCountries.map((c) => (
                <span
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-mist px-2.5 py-1 text-[12px] text-brandInk"
                  key={c.countryCode}
                >
                  <span aria-hidden="true">{flagEmoji(c.countryCode)}</span>
                  {c.title}
                </span>
              ))}
            </div>
          ) : null}
          {rows.map((row) => (
            <div className="flex items-center justify-between gap-4 py-1.5" key={row.label}>
              <dt className="flex items-center gap-2 text-[13px] text-onSurfaceVariant">
                <row.icon aria-hidden="true" className="text-brandBlue" size={15} />
                {row.label}
              </dt>
              <dd className="text-[13px] font-bold text-brandInk">{row.value}</dd>
            </div>
          ))}
        </dl>

        <PromoCodeField onChange={setPromo} onPendingChange={setPromoPending} packageId={plan.id} />

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-outline/70 pt-5">
          <span className="text-sm text-onSurfaceVariant">Total</span>
          <span className="flex items-center gap-2.5">
            {hasActiveDiscount(plan) ? (
              <>
                {discountPercentOff(plan) != null ? (
                  <span className="rounded-full bg-error/10 px-2 py-1 text-[10px] font-black text-error">
                    -{discountPercentOff(plan)}%
                  </span>
                ) : null}
                <span className="text-sm font-semibold text-onSurfaceVariant line-through">
                  {formatOriginalPrice(plan)}
                </span>
              </>
            ) : null}
            {promo ? (
              <span className="rounded-full bg-brandTeal/10 px-2 py-1 text-[10px] font-black text-brandTeal">
                -{promo.discountPct}%
              </span>
            ) : null}
            <span className="font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
              {displayPrice ?? (
                <span
                  aria-hidden="true"
                  className="inline-block h-8 w-24 animate-pulse rounded-md bg-mist align-middle"
                />
              )}
            </span>
          </span>
        </div>

        <p className="mt-6 text-center text-xs text-onSurfaceVariant">
          Changed your mind?{" "}
          <Link className="font-semibold text-brandBlue hover:text-brandInk" href="/destinations">
            Browse other destinations
          </Link>
        </p>
      </aside>
    </div>
  );
}
