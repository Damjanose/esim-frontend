"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/app/components/Button";
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
import { DatePicker } from "./DatePicker";
import { FlightResults, type SearchState } from "./FlightResults";
import { PlacePicker } from "./PlacePicker";

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

type Side = { country: string; airports: FlightAirport[]; loading: boolean };
const EMPTY_SIDE: Side = { country: "", airports: [], loading: false };

export function FlightSearchForm() {
  const [form, setForm] = useState<FlightForm>(EMPTY_FLIGHT_FORM);
  const [countries, setCountries] = useState<FlightCountry[]>([]);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [from, setFrom] = useState<Side>(EMPTY_SIDE);
  const [to, setTo] = useState<Side>(EMPTY_SIDE);
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [today, setToday] = useState("");
  const [swapTurns, setSwapTurns] = useState(0);
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
    setSwapTurns((turns) => turns + 1);
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
    setForm((current) => ({ ...current, departDate: next.departDate, returnDate: next.returnDate }));
    await runSearch(next);
  };

  return (
    <div>
      <form
        className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:p-7"
        noValidate
        onSubmit={submit}
      >
        <div className="relative grid rounded-[18px] bg-brandBlue/[0.045] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <PlacePicker
            airport={form.origin}
            airports={from.airports}
            countries={countries}
            country={from.country}
            label="From"
            loadingAirports={from.loading}
            onAirport={(iata) => set("origin", iata)}
            onCountry={(code) => pickCountry("from", code)}
            title="Flying from"
          />
          {/* Perforation: dashed tear line with notches cut into the ticket's edges, swap seated on it. */}
          <div className="relative flex h-11 items-center justify-center sm:h-auto sm:w-11">
            <span
              aria-hidden="true"
              className="absolute inset-x-5 top-1/2 border-t border-dashed border-brandBlue/25 sm:inset-x-auto sm:inset-y-5 sm:left-1/2 sm:top-auto sm:border-l sm:border-t-0"
            />
            <span
              aria-hidden="true"
              className="absolute -left-[11px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-surface sm:left-1/2 sm:top-[-11px] sm:-translate-x-1/2 sm:translate-y-0"
            />
            <span
              aria-hidden="true"
              className="absolute -right-[11px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-surface sm:bottom-[-11px] sm:left-1/2 sm:right-auto sm:top-auto sm:-translate-x-1/2 sm:translate-y-0"
            />
            <button
              aria-label="Swap from and to"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-brandBlue/20 bg-surface text-brandBlue transition hover:border-brandBlue/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brandBlue/20"
              onClick={swap}
              type="button"
            >
              <ArrowUpDown
                aria-hidden="true"
                className="transition-[rotate] duration-300 ease-out motion-reduce:transition-none sm:-rotate-90"
                size={18}
                style={{ rotate: `${swapTurns * 180}deg` }}
              />
            </button>
          </div>
          <PlacePicker
            airport={form.destination}
            airports={to.airports}
            countries={countries}
            country={to.country}
            label="To"
            loadingAirports={to.loading}
            onAirport={(iata) => set("destination", iata)}
            onCountry={(code) => pickCountry("to", code)}
            title="Flying to"
          />
        </div>

        <div className="mt-3">
          <DatePicker
            form={form}
            onDates={(dates) => setForm((current) => ({ ...current, ...dates }))}
            onTripType={(tripType) => set("tripType", tripType)}
            today={today}
          />
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
