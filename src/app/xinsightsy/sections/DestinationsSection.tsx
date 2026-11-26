"use client";

import { formatRate } from "@/lib/insights/format";
import { destinationLabel } from "@/lib/insights/destinationLabel";
import { highInterestFewSales } from "@/lib/insights/destinations";
import type { DestinationRow, DestinationsData } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { NoteBadge } from "../ui/NoteBadge";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

export function DestinationsSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  const { state, data, retry } = useInsightsReport<DestinationsData>("destinations", token, filters, { onUnauthorized });
  const report = data;
  const ready = report?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;
  const flagged = ready ? highInterestFewSales(ready.rows, ready.averageConversion) : new Set<string>();

  return (
    <section aria-labelledby="insights-destinations" className="space-y-4">
      <h2 id="insights-destinations" className="font-display text-xl font-black text-midnight">Destinations</h2>
      {report ? <div className="flex flex-wrap gap-2">{report.notes.map((code) => <NoteBadge key={code} code={code} />)}</div> : null}
      <SectionState state={status} onRetry={retry} emptyText="No destination activity in this range">
        {ready ? (
          <>
            <DataTable<DestinationRow>
              caption="Destinations"
              rowKey={(row) => row.destination}
              rows={ready.rows}
              columns={[
                { key: "destination", label: "Destination", value: (row) => destinationLabel(row.destination) },
                { key: "views", label: "Views", value: (row) => row.views, numeric: true },
                { key: "visitors", label: "Visitors", value: (row) => row.visitors, numeric: true },
                { key: "begins", label: "Checkout begins", value: (row) => row.checkoutBegins, numeric: true },
                { key: "orders", label: "Orders", value: (row) => row.orders, numeric: true },
                { key: "conversion", label: "Conversion", value: (row) => formatRate(row.conversion), sortValue: (row) => row.conversion, numeric: true },
                { key: "favourites", label: "Favourites", value: (row) => row.favourites, numeric: true },
                { key: "trips", label: "Trip plans", value: (row) => row.tripPlans, numeric: true }
              ]}
            />
            {flagged.size > 0 ? (
              <ul className="space-y-1 text-sm text-midnight/80">
                {ready.rows.filter((row) => flagged.has(row.destination)).map((row) => (
                  <li key={row.destination}>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">High interest, few sales</span>{" "}
                    {destinationLabel(row.destination)}. This is a pattern, not a cause.
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </SectionState>
    </section>
  );
}
