"use client";

import { Clock, CreditCard, MapPin, SearchX, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { belowSampleText, OPPORTUNITY_FOOTER, opportunityStyle, opportunityToneClass, sortOpportunityCards } from "@/lib/insights/opportunities";
import type { OpportunitiesData, OpportunityCard } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

const ICONS: Record<string, LucideIcon> = {
  "trending-down": TrendingDown,
  "credit-card": CreditCard,
  "map-pin": MapPin,
  "trending-up": TrendingUp,
  "search-x": SearchX,
  clock: Clock
};

export function OpportunitiesSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<OpportunitiesData>("opportunities", token, filters, { onUnauthorized, refreshKey });
  const ready = data?.data ?? null;
  const cards = ready ? sortOpportunityCards(ready.cards) : [];
  const status = state === "ready" && !ready ? "empty" : state;

  return (
    <section aria-labelledby="insights-opportunities" className="space-y-4">
      <h2 id="insights-opportunities" className="font-display text-xl font-black text-midnight">Opportunities</h2>
      <SectionState state={status} onRetry={retry} emptyText="No suggestions for this range">
        {ready?.belowSample ? (
          <p className="rounded-2xl border border-midnight/10 bg-white p-4 text-sm font-bold text-midnight/70">
            {belowSampleText(ready.minSample)}
          </p>
        ) : null}
        {ready && !ready.belowSample && cards.length === 0 ? (
          <p className="text-sm text-midnight/60">No patterns stand out in this range.</p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <OpportunityCardView key={card.key} card={card} />
          ))}
        </div>
      </SectionState>
      <p className="text-xs text-midnight/60">{OPPORTUNITY_FOOTER}</p>
    </section>
  );
}

function OpportunityCardView({ card }: { card: OpportunityCard }) {
  const style = opportunityStyle(card.rule);
  const Icon = ICONS[style.icon];
  return (
    <article className="space-y-3 rounded-2xl border border-midnight/10 bg-white p-4 shadow-card">
      <header className="flex items-start gap-3">
        {Icon ? <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${opportunityToneClass(style.tone)}`} /> : null}
        <div>
          <h3 className="font-display text-base font-black text-midnight">{card.title}</h3>
          <p className="text-sm text-midnight/80">{card.suggestion}</p>
        </div>
      </header>
      <DataTable<{ label: string; value: string }>
        caption={`Numbers for ${card.title}`}
        rowKey={(row) => row.label}
        rows={card.numbers}
        columns={[
          { key: "label", label: "Measure", value: (row) => row.label },
          { key: "value", label: "Value", value: (row) => row.value, numeric: true }
        ]}
      />
    </article>
  );
}
