"use client";

import { formatMoney, formatRate } from "@/lib/insights/format";
import { groupPromotionsByKind } from "@/lib/insights/promotions";
import { singleCurrencyValue } from "@/lib/insights/singleCurrency";
import type { PromotionRow, PromotionsData } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

export function PromotionsSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<PromotionsData>("promotions", token, filters, { onUnauthorized, refreshKey });
  const rows = data?.data.rows ?? [];
  const status = state === "ready" && rows.length === 0 ? "empty" : state;
  const groups = groupPromotionsByKind(rows);

  return (
    <section aria-labelledby="insights-promotions" className="space-y-4">
      <h2 id="insights-promotions" className="font-display text-xl font-black text-midnight">Promotions</h2>
      <p className="text-sm text-midnight/60">
        How each promotion did. Buyers within 7 days counts people who tapped and then paid within a week.
      </p>
      <SectionState state={status} onRetry={retry} emptyText="No promotions were shown in this range">
        {groups.map((group) => (
          <div key={group.kind} className="space-y-2">
            <h3 className="text-sm font-black text-midnight">{group.label}</h3>
            <DataTable<PromotionRow>
              caption={`${group.label} results`}
              rowKey={(row) => `${row.promoKind}-${row.promoId}`}
              rows={group.rows}
              columns={[
                { key: "promo", label: "Promotion", value: (row) => row.label ?? row.promoId },
                { key: "views", label: "Views", value: (row) => row.views, numeric: true },
                { key: "taps", label: "Taps", value: (row) => row.taps, numeric: true },
                { key: "tapRate", label: "Tap rate", value: (row) => formatRate(row.tapRate), sortValue: (row) => row.tapRate, numeric: true },
                { key: "buyers7", label: "Buyers within 7 days", value: (row) => row.buyersWithin7d, numeric: true },
                { key: "revenue7", label: "Revenue within 7 days", value: (row) => formatMoney(row.revenueWithin7d), sortValue: (row) => singleCurrencyValue(row.revenueWithin7d.byCurrency), numeric: true },
                ...(group.kind === "promo_code"
                  ? [{ key: "codeSales", label: "Sales with code", value: (row: PromotionRow) => row.salesWithCode, numeric: true }]
                  : [])
              ]}
            />
          </div>
        ))}
      </SectionState>
    </section>
  );
}
