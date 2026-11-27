"use client";

import { useState } from "react";
import { formatMoney, formatProfit, formatRate } from "@/lib/insights/format";
import { toCsv } from "@/lib/insights/csv";
import type { LocationRow, LocationsData } from "@/lib/insights/types";
import { DataTable } from "../ui/DataTable";
import { NoteBadge } from "../ui/NoteBadge";
import { SectionState } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { useInsightsReport } from "../useInsightsReport";

type Level = "country" | "region" | "city";
type Basis = "network" | "billing";

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: "country", label: "Country" },
  { value: "region", label: "US state" },
  { value: "city", label: "City" }
];

const BASES: Array<{ value: Basis; label: string }> = [
  { value: "network", label: "Network location" },
  { value: "billing", label: "Billing address" }
];

function downloadCsv(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function LocationsSection({ token, filters, onUnauthorized }: InsightsSectionProps) {
  // With one country picked (e.g. US), default to the state level.
  const [levelChoice, setLevelChoice] = useState<Level | null>(null);
  const [basis, setBasis] = useState<Basis>("network");
  const level = levelChoice ?? (filters.country === "US" ? "region" : "country");

  const { state, data, retry } = useInsightsReport<LocationsData>("locations", token, filters, { level, basis, onUnauthorized });
  const ready = data?.data ?? null;
  const status = state === "ready" && !ready ? "empty" : state;
  const rows = ready?.rows ?? [];

  function exportCsv() {
    const csv = toCsv(
      ["place", "visitors", "buyers", "orders", "conversion", "revenue", "profit"],
      rows.map((row) => [
        row.key,
        row.visitors,
        row.buyers,
        row.orders,
        row.conversion,
        formatMoney(row.revenue),
        formatProfit(row.profit)
      ])
    );
    downloadCsv(`insights-locations-${filters.from}-${filters.to}.csv`, csv);
  }

  return (
    <section aria-labelledby="insights-locations" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="insights-locations" className="font-display text-xl font-black text-midnight">Locations</h2>
        <button type="button" onClick={exportCsv} disabled={rows.length === 0} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold text-midnight disabled:opacity-50">
          Download CSV
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div role="tablist" aria-label="Place level" className="flex gap-1 rounded-full bg-cloud p-1">
          {LEVELS.map((item) => (
            <button key={item.value} role="tab" aria-selected={level === item.value} type="button" onClick={() => setLevelChoice(item.value)} className={`rounded-full px-3 py-1 text-sm font-bold ${level === item.value ? "bg-white text-midnight shadow-card" : "text-midnight/70"}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Location basis" className="flex gap-1 rounded-full bg-cloud p-1">
          {BASES.map((item) => (
            <button key={item.value} aria-pressed={basis === item.value} type="button" onClick={() => setBasis(item.value)} className={`rounded-full px-3 py-1 text-sm font-bold ${basis === item.value ? "bg-white text-midnight shadow-card" : "text-midnight/70"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {basis === "network" ? <NoteBadge code="network_location" /> : <NoteBadge code="billing_address_latest" />}
      <SectionState state={status} onRetry={retry} emptyText="No visitors with a location in this range">
        {ready ? (
          <DataTable<LocationRow>
            caption="Locations"
            rowKey={(row) => row.key}
            rows={rows}
            columns={[
              { key: "key", label: "Place", value: (row) => row.key },
              { key: "visitors", label: "Visitors", value: (row) => row.visitors, numeric: true },
              { key: "buyers", label: "Buyers", value: (row) => row.buyers, numeric: true },
              { key: "conversion", label: "Conversion", value: (row) => formatRate(row.conversion), sortValue: (row) => row.conversion, numeric: true },
              { key: "revenue", label: "Revenue", value: (row) => formatMoney(row.revenue), numeric: true },
              { key: "profit", label: "Profit", value: (row) => formatProfit(row.profit), numeric: true }
            ]}
          />
        ) : null}
      </SectionState>
      {ready && ready.unknownVisitors > 0 ? <p className="text-sm text-midnight/60">{ready.unknownVisitors} visitors have no location.</p> : null}
    </section>
  );
}
