"use client";

import { useEffect, useState } from "react";
import {
  defaultFilters,
  parseFilters,
  presetRange,
  serializeFilters,
  type InsightsFilters,
  type InsightsPreset
} from "@/lib/insights/query";

export type { InsightsFilters };

export type InsightsSectionProps = { token: string; filters: InsightsFilters; onUnauthorized?: () => void };

const todayUtc = () => new Date().toISOString().slice(0, 10);

/**
 * Filter state lives in the URL, so a link opens the same view. The URL is read after mount
 * (not during render) so the server HTML and the first client render match.
 */
export function useInsightsFilters(): [InsightsFilters, (next: InsightsFilters) => void] {
  const [filters, setFiltersState] = useState<InsightsFilters>(() => defaultFilters(todayUtc()));

  useEffect(() => {
    setFiltersState(parseFilters(new URLSearchParams(window.location.search), todayUtc()));
  }, []);

  function setFilters(next: InsightsFilters) {
    setFiltersState(next);
    const query = serializeFilters(next).toString();
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }

  return [filters, setFilters];
}

const PRESETS: Array<{ value: InsightsPreset; label: string }> = [
  { value: "7", label: "Last 7 days" },
  { value: "28", label: "Last 28 days" },
  { value: "90", label: "Last 90 days" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" }
];

const FIELD = "rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-midnight";

export function InsightsFilterBar({ filters, onChange }: { filters: InsightsFilters; onChange: (next: InsightsFilters) => void }) {
  const [countryDraft, setCountryDraft] = useState(filters.country === "all" ? "" : filters.country);
  const [countryError, setCountryError] = useState("");

  useEffect(() => {
    setCountryDraft(filters.country === "all" ? "" : filters.country);
  }, [filters.country]);

  function applyCountry(raw: string) {
    const value = raw.trim().toUpperCase();
    if (value === "") {
      setCountryError("");
      onChange({ ...filters, country: "all" });
    } else if (/^[A-Z]{2}$/.test(value)) {
      setCountryError("");
      onChange({ ...filters, country: value });
    } else {
      setCountryError("Use a two-letter country code, such as US.");
    }
  }

  return (
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-card" onSubmit={(event) => event.preventDefault()}>
      <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
        Period
        <select
          className={FIELD}
          value=""
          onChange={(event) => {
            const preset = event.target.value as InsightsPreset;
            if (preset) onChange({ ...filters, ...presetRange(preset, todayUtc()) });
          }}
        >
          <option value="">Choose…</option>
          {PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>{preset.label}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
        From
        <input type="date" className={FIELD} value={filters.from} max={filters.to} onChange={(event) => onChange({ ...filters, from: event.target.value })} />
      </label>
      <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
        To
        <input type="date" className={FIELD} value={filters.to} min={filters.from} onChange={(event) => onChange({ ...filters, to: event.target.value })} />
      </label>
      <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
        Platform
        <select className={FIELD} value={filters.platform} onChange={(event) => onChange({ ...filters, platform: event.target.value as InsightsFilters["platform"] })}>
          <option value="all">All</option>
          <option value="ios">iOS app</option>
          <option value="android">Android app</option>
          <option value="web">Website</option>
        </select>
      </label>
      <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
        Country
        <input
          className={`${FIELD} w-24 uppercase`}
          maxLength={2}
          placeholder="All"
          value={countryDraft}
          aria-invalid={countryError ? true : undefined}
          onChange={(event) => setCountryDraft(event.target.value)}
          onBlur={(event) => applyCountry(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") applyCountry(event.currentTarget.value);
          }}
        />
        {countryError ? <span className="text-[12px] font-bold normal-case tracking-normal text-red-700">{countryError}</span> : null}
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm font-bold text-midnight">
        <input type="checkbox" checked={filters.compare} onChange={(event) => onChange({ ...filters, compare: event.target.checked })} />
        Compare with the previous period
      </label>
    </form>
  );
}
