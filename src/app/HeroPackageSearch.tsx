'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Wifi } from "lucide-react";
import {
  fetchPackageOptions,
  filterPackageOptions,
  type HeroPackageOption
} from "@/services/packages";

export function HeroPackageSearch() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);
        const options = await fetchPackageOptions();
        if (active) setPackages(options);
      } catch {
        if (active) setError("Packages are unavailable right now. Please try again soon.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPackages();

    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    return filterPackageOptions(packages, query);
  }, [packages, query]);

  function handleSearchClick() {
    setIsOpen(true);
  }

  return (
    <div
      className="relative z-40 mt-9 max-w-2xl rounded-xl border border-cyan/20 bg-white/78 p-2 shadow-card backdrop-blur"
      ref={rootRef}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex min-h-14 flex-1 items-center gap-3 rounded-lg bg-cloud px-4">
          <Search aria-hidden="true" className="text-cyan" size={20} />
          <span className="sr-only">Destination search</span>
          <input
            className="w-full bg-transparent text-sm font-medium text-midnight outline-none placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Where are you traveling to?"
            type="search"
            value={query}
          />
        </label>
        <button
          className="inline-flex min-h-14 items-center justify-center rounded-lg bg-cyan px-6 text-sm font-black text-midnight transition hover:bg-aqua"
          onClick={handleSearchClick}
          type="button"
        >
          Search Plans
        </button>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="border-b border-line px-4 py-3">
            <p className="text-xs font-black uppercase text-slate-500">
              {query.trim() ? "Matching packages" : "Popular packages"}
            </p>
          </div>

          {loading ? (
            <p className="px-4 py-4 text-sm font-semibold text-slate-500">
              Loading packages...
            </p>
          ) : error ? (
            <p className="px-4 py-4 text-sm font-semibold text-slate-500">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-sm font-semibold text-slate-500">
              No packages found. Try Japan, USA, France, UK, or Turkey.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.map((pkg) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition hover:bg-cloud"
                  key={pkg.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan/15 text-midnight">
                      <Wifi aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-midnight">
                        {pkg.title}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {pkg.subtitle} - {pkg.details}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-black text-midnight">
                      {pkg.price}
                    </p>
                    <p className="text-[11px] font-bold uppercase text-slate-400">View only</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
