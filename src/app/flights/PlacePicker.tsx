"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Search, X } from "lucide-react";
import { filterAirports, filterCountries } from "@/lib/flightPickers";
import type { FlightAirport, FlightCountry } from "@/lib/flightSearch";
import { CountryFlag } from "./CountryFlag";

type Step = "country" | "airport";

type Props = {
  /** "From" / "To". */
  label: string;
  /** Panel heading, e.g. "Flying from". */
  title: string;
  countries: FlightCountry[];
  country: string;
  airport: string;
  airports: FlightAirport[];
  loadingAirports: boolean;
  onCountry: (code: string) => void;
  onAirport: (iata: string) => void;
};

/**
 * One half of the route ticket: shows the chosen airport as a big IATA code, and opens
 * a searchable panel that steps from country (with flags) to that country's airports.
 * Below `sm` the panel is a bottom sheet; above it, a dropdown under the half.
 */
export function PlacePicker({
  label,
  title,
  countries,
  country,
  airport,
  airports,
  loadingAirports,
  onCountry,
  onAirport
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("country");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const countryName = countries.find((item) => item.code === country)?.name ?? "";
  const picked = airports.find((item) => item.iata === airport);

  const countryRows = useMemo(() => filterCountries(countries, query), [countries, query]);
  const airportRows = useMemo(() => filterAirports(airports, query), [airports, query]);
  const count = step === "country" ? countryRows.length : airportRows.length;

  const go = (next: Step) => {
    setStep(next);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  };

  const openPanel = () => {
    setStep(country ? "airport" : "country");
    setQuery("");
    setActive(0);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the keyboard-active option in view.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, step]);

  const chooseCountry = (code: string) => {
    if (code !== country) onCountry(code);
    go("airport");
  };

  const chooseAirport = (iata: string) => {
    onAirport(iata);
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!count) return;
      setActive((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (step === "country" && countryRows[active]) chooseCountry(countryRows[active].code);
      if (step === "airport" && airportRows[active]) chooseAirport(airportRows[active].iata);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Backspace" && !query && step === "airport") {
      go("country");
    }
  };

  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-opt-${index}`;
  const place = [picked?.city, countryName].filter(Boolean).join(", ");

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={picked ? `${label}: ${picked.city} ${picked.iata}, ${countryName}` : `${label}: choose airport`}
        className="group block w-full rounded-[16px] px-5 py-4 text-left outline-none transition hover:bg-brandBlue/[0.04] focus-visible:ring-4 focus-visible:ring-brandBlue/20"
        onClick={openPanel}
        ref={triggerRef}
        type="button"
      >
        <span className="flex h-5 items-center justify-between">
          <span className="text-body-sm text-onSurfaceVariant">{label}</span>
          {country ? <CountryFlag className="h-[18px] w-6 rounded-[3px]" code={country} /> : null}
        </span>
        {picked ? (
          <span className="mt-1 block font-display text-[40px] font-bold leading-[46px] tracking-[0.02em] text-brandInk">
            {picked.iata}
          </span>
        ) : (
          <span className="mt-2 block pb-1 font-display text-headline-md text-onSurfaceVariant/70 group-hover:text-brandBlue">
            Choose airport
          </span>
        )}
        <span className="block min-h-[21px] truncate text-body-md text-onSurfaceVariant">
          {place || (countryName ? countryName : "Country, then airport")}
        </span>
      </button>

      {open ? (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-40 bg-brandInk/30 sm:bg-transparent" onClick={close} />
          <div
            aria-label={title}
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-[20px] border border-outline/70 bg-surface shadow-brandCard sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-[440px] sm:w-[380px] sm:rounded-[16px]"
            role="dialog"
          >
            <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
              <p className="text-title-sm text-brandInk">{title}</p>
              <button
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-onSurfaceVariant hover:bg-brandBlue/[0.06]"
                onClick={close}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            {step === "airport" ? (
              <div className="mx-5 mb-3 flex shrink-0 items-center gap-2">
                <CountryFlag className="h-[18px] w-6 rounded-[3px]" code={country} />
                <span className="min-w-0 flex-1 truncate text-body-md text-brandInk">{countryName}</span>
                <button
                  className="text-body-md font-semibold text-brandBlue hover:underline"
                  onClick={() => go("country")}
                  type="button"
                >
                  Change country
                </button>
              </div>
            ) : null}

            <div className="mx-5 mb-2 flex h-11 shrink-0 items-center gap-2 rounded-[12px] border border-outline bg-surface px-3 focus-within:border-brandBlue focus-within:ring-4 focus-within:ring-brandBlue/15">
              <Search aria-hidden="true" className="shrink-0 text-onSurfaceVariant" size={18} />
              <input
                aria-activedescendant={count ? optionId(active) : undefined}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded="true"
                aria-label={step === "country" ? "Search countries" : "Search airports"}
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent text-base text-brandInk outline-none placeholder:text-onSurfaceVariant/60 sm:text-sm"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={step === "country" ? "Search country" : "Search city, airport or code"}
                ref={inputRef}
                role="combobox"
                value={query}
              />
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3" id={listId} ref={listRef} role="listbox">
              {step === "country" ? (
                countryRows.length ? (
                  countryRows.map((item, index) => (
                    <li
                      aria-selected={item.code === country}
                      className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 ${
                        index === active ? "bg-brandBlue/[0.07]" : "hover:bg-brandBlue/[0.04]"
                      }`}
                      data-index={index}
                      id={optionId(index)}
                      key={item.code}
                      onClick={() => chooseCountry(item.code)}
                      onMouseMove={() => setActive(index)}
                      role="option"
                    >
                      <CountryFlag className="h-[21px] w-7 rounded-[4px]" code={item.code} />
                      <span className="min-w-0 flex-1 truncate text-body-md text-brandInk">{item.name}</span>
                      {item.code === country ? <Check aria-hidden="true" className="text-brandBlue" size={18} /> : null}
                    </li>
                  ))
                ) : (
                  <Empty>{countries.length ? "No country matches that search." : "Loading countries..."}</Empty>
                )
              ) : loadingAirports ? (
                <Empty>Loading airports...</Empty>
              ) : airportRows.length ? (
                airportRows.map((item, index) => (
                  <li
                    aria-selected={item.iata === airport}
                    className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2 ${
                      index === active ? "bg-brandBlue/[0.07]" : "hover:bg-brandBlue/[0.04]"
                    }`}
                    data-index={index}
                    id={optionId(index)}
                    key={item.iata}
                    onClick={() => chooseAirport(item.iata)}
                    onMouseMove={() => setActive(index)}
                    role="option"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-md font-semibold text-brandInk">{item.city}</span>
                      <span className="block truncate text-body-sm text-onSurfaceVariant">{item.name}</span>
                    </span>
                    <span className="font-display text-title-sm font-bold tracking-[0.04em] text-brandInk">
                      {item.iata}
                    </span>
                    {item.iata === airport ? <Check aria-hidden="true" className="text-brandBlue" size={18} /> : null}
                  </li>
                ))
              ) : (
                <Empty>{airports.length ? "No airport matches that search." : "No airports found for this country."}</Empty>
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <li className="px-2 py-6 text-center text-body-sm text-onSurfaceVariant" role="presentation">
      {children}
    </li>
  );
}
