"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import { Button } from "@/app/components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
import {
  EMPTY_FLIGHT_FORM,
  buildSearchQuery,
  flightFormError,
  withDepartDate,
  type FlightAirport,
  type FlightCountry,
  type FlightForm,
  type FlightSearchResult
} from "@/lib/flightSearch";
import { todayIso } from "@/lib/tripPlan/logic";
import { FlightResults, type SearchState } from "./FlightResults";

type Envelope<T> = { status?: string; data?: T; error?: string };

async function getJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    const body = (await response.json()) as Envelope<T>;
    if (!response.ok || body.status === "error" || !body.data) {
      return { ok: false, status: response.ok ? 400 : response.status, message: body.error ?? "Something went wrong." };
    }
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, status: 0, message: "We could not reach the flight search. Please try again." };
  }
}

/** One side of the trip: a country select, then an airport select for that country. */
function Endpoint({
  label,
  countries,
  country,
  onCountry,
  airport,
  onAirport,
  airports,
  loading
}: {
  label: string;
  countries: FlightCountry[];
  country: string;
  onCountry: (code: string) => void;
  airport: string;
  onAirport: (iata: string) => void;
  airports: FlightAirport[];
  loading: boolean;
}) {
  const id = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={FIELD_LABEL_CLASSES} htmlFor={`${id}-country`}>
          {label} country
        </label>
        <select
          className={FIELD_INPUT_CLASSES}
          id={`${id}-country`}
          onChange={(event) => onCountry(event.target.value)}
          value={country}
        >
          <option value="">Select country</option>
          {countries.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={FIELD_LABEL_CLASSES} htmlFor={`${id}-airport`}>
          {label} airport
        </label>
        <select
          className={FIELD_INPUT_CLASSES}
          disabled={!country || loading}
          id={`${id}-airport`}
          onChange={(event) => onAirport(event.target.value)}
          value={airport}
        >
          <option value="">{loading ? "Loading airports..." : "Select airport"}</option>
          {airports.map((item) => (
            <option key={item.iata} value={item.iata}>
              {item.city} - {item.name} ({item.iata})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type Side = { country: string; airports: FlightAirport[]; loading: boolean };
const EMPTY_SIDE: Side = { country: "", airports: [], loading: false };

export function FlightSearchForm() {
  const ids = useId();
  const [form, setForm] = useState<FlightForm>(EMPTY_FLIGHT_FORM);
  const [countries, setCountries] = useState<FlightCountry[]>([]);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [from, setFrom] = useState<Side>(EMPTY_SIDE);
  const [to, setTo] = useState<Side>(EMPTY_SIDE);
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [today, setToday] = useState("");
  // Guards against an older response landing after a newer search or country change.
  const searchSeq = useRef(0);
  const airportSeq = useRef({ from: 0, to: 0 });

  useEffect(() => {
    setToday(todayIso());
    let cancelled = false;
    void getJson<{ countries: FlightCountry[] }>("/bff/flights/countries").then((result) => {
      if (cancelled) return;
      if (result.ok) setCountries(result.data.countries ?? []);
      else setCountriesError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof FlightForm>(key: K, value: FlightForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const pickCountry = (side: "from" | "to", code: string) => {
    const setSide = side === "from" ? setFrom : setTo;
    const field = side === "from" ? "origin" : "destination";
    set(field, "");
    const seq = ++airportSeq.current[side];
    if (!code) {
      setSide(EMPTY_SIDE);
      return;
    }
    setSide({ country: code, airports: [], loading: true });
    void getJson<{ airports: FlightAirport[] }>(`/bff/flights/airports?country=${encodeURIComponent(code)}`).then(
      (result) => {
        if (seq !== airportSeq.current[side]) return;
        setSide({ country: code, airports: result.ok ? (result.data.airports ?? []) : [], loading: false });
        if (!result.ok) setFormError(result.message);
      }
    );
  };

  const swap = () => {
    airportSeq.current = { from: airportSeq.current.to, to: airportSeq.current.from };
    setFrom(to);
    setTo(from);
    setForm((current) => ({ ...current, origin: current.destination, destination: current.origin }));
  };

  const error = today ? flightFormError(form, today) : "Loading";
  const searching = state.kind === "loading";

  const runSearch = async (searchForm: FlightForm) => {
    setFormError(null);

    const seq = ++searchSeq.current;
    setState({ kind: "loading" });
    const result = await getJson<FlightSearchResult>(`/bff/flights/search?${buildSearchQuery(searchForm)}`);
    if (seq !== searchSeq.current) return;

    if (result.ok) {
      setState({ kind: "done", result: result.data, form: searchForm });
    } else {
      setState({
        kind: "error",
        status: result.status,
        message: result.message,
        form: searchForm
      });
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (flightFormError(form, today || todayIso()) || searching) return;
    await runSearch(form);
  };

  const pickDate = async (date: string) => {
    const base = state.kind === "done" || state.kind === "error" ? state.form : form;
    const next = withDepartDate(base, date);
    if (searching || flightFormError(next, today || todayIso())) return;
    setForm(next);
    await runSearch(next);
  };

  const tripButton = (value: FlightForm["tripType"], label: string) => (
    <button
      aria-pressed={form.tripType === value}
      className={`h-10 rounded-full px-4 text-sm font-bold transition ${
        form.tripType === value
          ? "bg-brandBlue text-white"
          : "border border-outline bg-surface text-onSurfaceVariant hover:text-brandInk"
      }`}
      onClick={() => set("tripType", value)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div>
      <form
        className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:p-7"
        noValidate
        onSubmit={submit}
      >
        <div aria-label="Trip type" className="flex gap-2" role="group">
          {tripButton("round-trip", "Round trip")}
          {tripButton("one-way", "One way")}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
          <Endpoint
            airport={form.origin}
            airports={from.airports}
            countries={countries}
            country={from.country}
            label="From"
            loading={from.loading}
            onAirport={(iata) => set("origin", iata)}
            onCountry={(code) => pickCountry("from", code)}
          />
          <button
            aria-label="Swap from and to"
            className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-outline bg-surface text-brandBlue transition hover:border-brandBlue/50"
            onClick={swap}
            type="button"
          >
            <ArrowLeftRight aria-hidden="true" className="rotate-90 lg:rotate-0" size={18} />
          </button>
          <Endpoint
            airport={form.destination}
            airports={to.airports}
            countries={countries}
            country={to.country}
            label="To"
            loading={to.loading}
            onAirport={(iata) => set("destination", iata)}
            onCountry={(code) => pickCountry("to", code)}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={`${ids}-depart`}>
              Departure
            </label>
            <input
              className={FIELD_INPUT_CLASSES}
              id={`${ids}-depart`}
              min={today || undefined}
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) => ({
                  ...current,
                  departDate: value,
                  returnDate: current.returnDate && value && current.returnDate < value ? value : current.returnDate
                }));
              }}
              type="date"
              value={form.departDate}
            />
          </div>
          {form.tripType === "round-trip" ? (
            <div>
              <label className={FIELD_LABEL_CLASSES} htmlFor={`${ids}-return`}>
                Return
              </label>
              <input
                className={FIELD_INPUT_CLASSES}
                id={`${ids}-return`}
                min={form.departDate || today || undefined}
                onChange={(event) => set("returnDate", event.target.value)}
                type="date"
                value={form.returnDate}
              />
            </div>
          ) : null}
        </div>

        {countriesError ? (
          <p className="mt-4 text-body-sm font-medium text-error" role="alert">
            {countriesError}
          </p>
        ) : null}
        {formError ? (
          <p className="mt-4 text-body-sm font-medium text-error" role="alert">
            {formError}
          </p>
        ) : error && error !== "Loading" && (form.origin || form.destination || form.departDate) ? (
          <p className="mt-4 text-body-sm text-onSurfaceVariant">{error}</p>
        ) : null}

        <div className="mt-5">
          <Button disabled={Boolean(error)} hero loading={searching} type="submit" variant="lit">
            <Search aria-hidden="true" size={18} />
            Search flights
          </Button>
        </div>
      </form>

      <FlightResults onPickDate={pickDate} state={state} />
    </div>
  );
}
