"use client";

import { useEffect, useState } from "react";
import {
  AREAS,
  DEFAULT_FILTERS,
  KINDS,
  NO_EMAIL_REASONS,
  PAGE_SIZES,
  PLATFORMS,
  SEVERITIES,
  SOURCES,
  STATUS_CLASSES,
  type ErrorFilters
} from "@/lib/xerrors-filters";

const INPUT = "mt-1 h-10 w-full rounded-xl border border-line px-2.5 text-sm font-normal text-midnight outline-none focus:border-cyan";
const SELECT = "mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight";
const LABEL = "text-xs font-bold text-muted";

function Select({
  label,
  value,
  onChange,
  options,
  allLabel = "All"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<string | { value: string; label: string }>;
  allLabel?: string | null;
}) {
  return (
    <label className={LABEL}>
      {label}
      <select className={SELECT} onChange={(event) => onChange(event.target.value)} value={value}>
        {allLabel === null ? null : <option value="">{allLabel}</option>}
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className={LABEL}>
      {label}
      <input
        className={INPUT}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

/**
 * Filter form with its own draft: nothing hits the URL (and the backend) until Apply,
 * except page size and sort which apply immediately like a table header would.
 */
export function ErrorFiltersPanel({
  filters,
  isLoading,
  onApply
}: {
  filters: ErrorFilters;
  isLoading: boolean;
  onApply: (next: ErrorFilters) => void;
}) {
  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters]);

  const set = (key: keyof ErrorFilters) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
        }}
      >
        <Text label="Search (email, request ID, payment, ICCID, message)" onChange={set("q")} value={draft.q} />
        <Select label="Kind" onChange={set("kind")} options={KINDS} value={draft.kind} />
        <Select label="Source" onChange={set("source")} options={SOURCES} value={draft.source} />
        <Select label="Severity" onChange={set("severity")} options={SEVERITIES} value={draft.severity} />
        <Select label="Area" onChange={set("area")} options={AREAS} value={draft.area} />
        <Text label="Status code" onChange={set("statusCode")} placeholder="e.g. 502" value={draft.statusCode} />
        <Select label="Status class" onChange={set("statusClass")} options={STATUS_CLASSES} value={draft.statusClass} />
        <Select label="Platform" onChange={set("platform")} options={PLATFORMS} value={draft.platform} />
        <Text label="App version" onChange={set("appVersion")} value={draft.appVersion} />
        <Text label="Scenario" onChange={set("scenario")} placeholder="e.g. purchase_plan" value={draft.scenario} />
        <Select
          allLabel={null}
          label="State"
          onChange={set("resolved")}
          options={[
            { value: "false", label: "Unresolved" },
            { value: "true", label: "Resolved" },
            { value: "all", label: "All" }
          ]}
          value={draft.resolved}
        />
        <Select
          label="User email"
          onChange={set("hasEmail")}
          options={[
            { value: "true", label: "With email" },
            { value: "false", label: "No email" }
          ]}
          value={draft.hasEmail}
        />
        <Select label="No-email reason" onChange={set("noEmailReason")} options={NO_EMAIL_REASONS} value={draft.noEmailReason} />
        <Text label="IP" onChange={set("ip")} value={draft.ip} />
        <Text label="From" onChange={set("from")} type="date" value={draft.from} />
        <Text label="To" onChange={set("to")} type="date" value={draft.to} />
        <label className="flex items-center gap-2 text-xs font-bold text-midnight sm:col-span-2 lg:col-span-4">
          <input
            checked={draft.includeMinor === "true"}
            onChange={(event) => set("includeMinor")(event.target.checked ? "true" : "")}
            type="checkbox"
          />
          Include all 4xx / minor errors
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button
            className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-5 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Loading..." : "Apply"}
          </button>
          <button
            className="h-10 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight transition hover:border-cyan"
            onClick={() => onApply({ ...DEFAULT_FILTERS, limit: filters.limit, sort: filters.sort })}
            type="button"
          >
            Reset
          </button>
          <div className="ml-auto flex items-end gap-2">
            <Select
              allLabel={null}
              label="Sort"
              onChange={(value) => onApply({ ...filters, sort: value })}
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" }
              ]}
              value={filters.sort}
            />
            <Select
              allLabel={null}
              label="Page size"
              onChange={(value) => onApply({ ...filters, limit: value })}
              options={PAGE_SIZES}
              value={filters.limit}
            />
          </div>
        </div>
      </form>
    </section>
  );
}
