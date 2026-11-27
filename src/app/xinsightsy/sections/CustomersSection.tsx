"use client";

import { formatMoney, formatRate } from "@/lib/insights/format";
import { cohortRepeatRate, formatMedianDays } from "@/lib/insights/customers";
import type { CustomersData } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { SectionState } from "../ui/SectionState";
import { StatTile } from "../ui/StatTile";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

type Cohort = CustomersData["cohorts"][number];

export function CustomersSection({ token, filters, onUnauthorized, refreshKey }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<CustomersData>("customers", token, filters, { onUnauthorized, refreshKey });
  const ready = data?.data ?? null;
  const status = state === "ready" && (!ready || ready.buyers === 0) ? "empty" : state;

  return (
    <section aria-labelledby="insights-customers" className="space-y-4">
      <h2 id="insights-customers" className="font-display text-xl font-black text-midnight">Customers</h2>
      <p className="text-sm text-midnight/60">Who came back to buy again. Cohorts group buyers by the month of their first purchase.</p>
      <SectionState state={status} onRetry={retry} emptyText="No buyers in this range">
        {ready ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Repeat rate" value={formatRate(ready.repeatRate)} hint={`${ready.repeatBuyers} of ${ready.buyers} buyers`} />
              <StatTile label="Top-up buyers" value={ready.topupBuyers} />
              <StatTile label="Median days between purchases" value={formatMedianDays(ready.medianDaysBetweenPurchases)} />
              <StatTile label="Buyers" value={ready.buyers} />
            </div>
            <DataTable<Cohort>
              caption="Customer cohorts"
              rowKey={(row) => row.month}
              rows={ready.cohorts}
              columns={[
                { key: "month", label: "First purchase month", value: (row) => row.month },
                { key: "buyers", label: "Buyers", value: (row) => row.buyers, numeric: true },
                { key: "repeat", label: "Repeat buyers", value: (row) => row.repeatBuyers, numeric: true },
                { key: "repeatRate", label: "Repeat rate", value: (row) => formatRate(cohortRepeatRate(row)), sortValue: (row) => cohortRepeatRate(row), numeric: true },
                { key: "spend", label: "Spend", value: (row) => formatMoney(row.spend), numeric: true }
              ]}
            />
          </>
        ) : null}
      </SectionState>
    </section>
  );
}
