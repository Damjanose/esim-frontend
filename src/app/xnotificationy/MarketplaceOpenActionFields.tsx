"use client";

import { useEffect, useMemo, useState } from "react";
import {
  coveredDestinationsForOption,
  fetchPackageOptions,
  normalizeDestinationValue,
  type HeroPackageOption,
} from "@/services/packages";
import { MARKETPLACE_PASS_OPTIONS } from "./marketplacePassOptions";
import {
  SORT_OPTIONS,
  type OpenActionDraft,
} from "./marketplaceOpenAction";

type DestinationOption = { id: string; label: string };

function deriveDestinationOptions(packages: readonly HeroPackageOption[]): DestinationOption[] {
  const map = new Map<string, string>();
  for (const pkg of packages) {
    if (pkg.countryCode?.trim() && pkg.country?.trim()) {
      const id = normalizeDestinationValue(pkg.countryCode) || normalizeDestinationValue(pkg.country);
      if (id && !map.has(id)) map.set(id, pkg.country);
    }
    for (const covered of coveredDestinationsForOption(pkg)) {
      const id =
        normalizeDestinationValue(covered.slug) ||
        normalizeDestinationValue(covered.countryCode) ||
        normalizeDestinationValue(covered.title);
      if (id && !map.has(id)) map.set(id, covered.title || id);
    }
  }
  return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function MarketplaceOpenActionFields({
  idPrefix,
  draft,
  onChange,
}: {
  idPrefix: string;
  draft: OpenActionDraft;
  onChange: (next: OpenActionDraft) => void;
}) {
  const [catalog, setCatalog] = useState<HeroPackageOption[]>([]);
  const [search, setSearch] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchPackageOptions()
      .then((packages) => {
        if (!cancelled) {
          setCatalog(packages);
          setCatalogError("");
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogError("Could not load destinations — use custom slug below.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => deriveDestinationOptions(catalog), [catalog]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    return options
      .filter((o) => o.label.toLowerCase().includes(q) || o.id.includes(q))
      .slice(0, 80);
  }, [options, search]);

  function patch(partial: Partial<OpenActionDraft>) {
    onChange({ ...draft, ...partial });
  }

  function toggleDestination(id: string) {
    const next = draft.destinations.includes(id)
      ? draft.destinations.filter((d) => d !== id)
      : [...draft.destinations, id];
    patch({ destinations: next });
  }

  function addCustom() {
    const slug = customSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    if (!draft.destinations.includes(slug)) {
      patch({ destinations: [...draft.destinations, slug] });
    }
    setCustomSlug("");
  }

  function labelFor(id: string) {
    return options.find((o) => o.id === id)?.label ?? id;
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-line bg-[#fafcfd] p-4">
      <div>
        <p className="text-sm font-black text-midnight">Open in app</p>
        <p className="mt-1 text-xs font-semibold text-muted">
          Optional. Pass and filters combine: Marketplace applies the continental pass first, then these
          advanced filters.
        </p>
      </div>

      <label className="block text-sm font-bold text-midnight" htmlFor={`${idPrefix}-pass`}>
        Continental pass
      </label>
      <select
        className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
        id={`${idPrefix}-pass`}
        onChange={(event) => patch({ passId: event.target.value })}
        value={draft.passId}
      >
        {MARKETPLACE_PASS_OPTIONS.map((option) => (
          <option key={option.id || "none"} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="block text-sm font-bold text-midnight" htmlFor={`${idPrefix}-dest-search`}>
        Destinations
      </label>
      {catalogError ? <p className="text-xs font-bold text-amber-700">{catalogError}</p> : null}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <input
          className="h-11 w-full border-b border-line px-3.5 text-sm outline-none focus:border-cyan"
          id={`${idPrefix}-dest-search`}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search destinations"
          type="search"
          value={search}
        />
        <div className="max-h-40 overflow-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-xs font-semibold text-muted">No matching destinations.</p>
          ) : (
            filtered.map((option) => (
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold hover:bg-[#f0f5f9]"
                key={option.id}
              >
                <input
                  checked={draft.destinations.includes(option.id)}
                  onChange={() => toggleDestination(option.id)}
                  type="checkbox"
                />
                <span>{option.label}</span>
                <span className="ml-auto text-xs font-semibold text-muted">{option.id}</span>
              </label>
            ))
          )}
        </div>
        <div className="flex gap-2 border-t border-line bg-[#fafcfd] p-2.5">
          <input
            className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-cyan"
            onChange={(event) => setCustomSlug(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder="Custom slug (albania)"
            type="text"
            value={customSlug}
          />
          <button
            className="h-10 shrink-0 rounded-xl border border-line bg-white px-3 text-xs font-bold text-midnight"
            onClick={addCustom}
            type="button"
          >
            Add slug
          </button>
        </div>
      </div>
      {draft.destinations.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {draft.destinations.map((id) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-[#b8e8df] bg-[#e8f7f4] px-2.5 py-1 text-xs font-bold text-midnight"
              key={id}
            >
              {labelFor(id)}
              <button
                aria-label={`Remove ${id}`}
                className="text-muted"
                onClick={() => toggleDestination(id)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <label className="block text-sm font-bold text-midnight">Price (EUR)</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-cyan"
          inputMode="decimal"
          onChange={(event) => patch({ priceFrom: event.target.value })}
          placeholder="From"
          type="number"
          value={draft.priceFrom}
        />
        <input
          className="h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-cyan"
          inputMode="decimal"
          onChange={(event) => patch({ priceTo: event.target.value })}
          placeholder="To"
          type="number"
          value={draft.priceTo}
        />
      </div>

      <label className="block text-sm font-bold text-midnight">Duration (days)</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-cyan"
          inputMode="numeric"
          onChange={(event) => patch({ durationFrom: event.target.value })}
          placeholder="From"
          type="number"
          value={draft.durationFrom}
        />
        <input
          className="h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-cyan"
          inputMode="numeric"
          onChange={(event) => patch({ durationTo: event.target.value })}
          placeholder="To"
          type="number"
          value={draft.durationTo}
        />
      </div>

      <label className="block text-sm font-bold text-midnight">Data (GB)</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-cyan"
          inputMode="decimal"
          onChange={(event) => patch({ dataFrom: event.target.value })}
          placeholder="From"
          type="number"
          value={draft.dataFrom}
        />
        <input
          className="h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-cyan"
          inputMode="decimal"
          onChange={(event) => patch({ dataTo: event.target.value })}
          placeholder="To"
          type="number"
          value={draft.dataTo}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-midnight">
        <input
          checked={draft.includeUnlimited}
          onChange={(event) => patch({ includeUnlimited: event.target.checked })}
          type="checkbox"
        />
        Include unlimited data plans
      </label>

      <label className="block text-sm font-bold text-midnight" htmlFor={`${idPrefix}-sort`}>
        Sort
      </label>
      <select
        className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
        id={`${idPrefix}-sort`}
        onChange={(event) => patch({ sort: event.target.value as OpenActionDraft["sort"] })}
        value={draft.sort}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
