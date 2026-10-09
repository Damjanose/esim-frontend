"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { ArrowRight, ExternalLink } from "lucide-react";
import flightLoaderAnimation from "@/../public/lottie/Flight-loader.json";
import {
  airlineLabel,
  dayDiffLabel,
  dropPastOffers,
  isPastDay,
  tripNights,
  formatDuration,
  formatFlightDate,
  formatFlightTime,
  formatPrice,
  formatStops,
  formatStripDay,
  isOtherAirport,
  type FlightAirlineLink,
  type FlightFallbackLink,
  type FlightForm,
  type FlightOffer,
  type FlightSearchResult
} from "@/lib/flightSearch";
import { todayIso } from "@/lib/tripPlan/logic";

export type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; result: FlightSearchResult; form: FlightForm }
  | { kind: "error"; status: number; message: string; form: FlightForm };

const PROVIDER_LABEL: Record<FlightFallbackLink["provider"], string> = {
  google: "Google Flights",
  skyscanner: "Skyscanner"
};

/** Used when the backend sent no fallback links (e.g. it was unreachable). */
function localFallbackLinks(form: FlightForm): FlightFallbackLink[] {
  const text = `Flights from ${form.origin} to ${form.destination} on ${form.departDate}`;
  const round = form.tripType === "round-trip" && form.returnDate;
  const query = `${text}${round ? ` returning ${form.returnDate}` : " one way"}`;
  const yymmdd = (iso: string) => iso.slice(2).replaceAll("-", "");
  return [
    { provider: "google", url: `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}` },
    {
      provider: "skyscanner",
      url: `https://www.skyscanner.net/transport/flights/${form.origin.toLowerCase()}/${form.destination.toLowerCase()}/${yymmdd(form.departDate)}/${round ? `${yymmdd(form.returnDate)}/` : ""}`
    }
  ];
}

function FallbackLinks({ links }: { links: FlightFallbackLink[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {links.map((link) => (
        <li key={link.provider}>
          <a
            className="inline-flex h-11 items-center gap-2 rounded-full border border-outline bg-surface px-5 text-sm font-bold text-brandBlue transition hover:border-brandBlue/50"
            href={link.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            Search on {PROVIDER_LABEL[link.provider]}
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        </li>
      ))}
    </ul>
  );
}

const AIRLINE_LABEL: Record<FlightAirlineLink["provider"], string> = {
  ryanair: "Ryanair",
  easyjet: "easyJet",
  wizzair: "Wizz Air",
  pegasus: "Pegasus"
};

/** Airlines that don't sell through our fare source, so their fares are never in the list above. */
function AirlineLinks({ links }: { links: FlightAirlineLink[] | undefined }) {
  if (!links || links.length === 0) return null;
  return (
    <>
      <p className="mt-5 text-body-sm text-onSurfaceVariant">
        Fares from these low-cost airlines aren&apos;t in our results. Check them on the airline&apos;s site:
      </p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.provider}>
            <a
              className="inline-flex h-11 items-center gap-2 rounded-full border border-outline bg-surface px-5 text-sm font-bold text-brandBlue transition hover:border-brandBlue/50"
              href={link.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {AIRLINE_LABEL[link.provider]}
              <ExternalLink aria-hidden="true" size={15} />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function Loading() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <div className="flex flex-col items-center py-10 text-center" role="status">
      <div className="h-24 w-24">
        <Lottie animationData={flightLoaderAnimation} autoplay={!reduceMotion} loop={!reduceMotion} />
      </div>
      <p className="mt-2 text-body-md font-semibold text-brandInk">Looking for fares...</p>
    </div>
  );
}

function Leg({ label, at, stops }: { label: string; at: string; stops: number | null }) {
  return (
    <div className="min-w-0">
      <p className="text-label-caps uppercase text-onSurfaceVariant">{label}</p>
      <p className="mt-0.5 text-body-md font-semibold text-brandInk">{formatFlightTime(at)}</p>
      {stops != null ? <p className="text-body-sm text-onSurfaceVariant">{formatStops(stops)}</p> : null}
    </div>
  );
}

function DateStrip({
  strip,
  selected,
  today,
  nights,
  onPick
}: {
  strip: NonNullable<FlightSearchResult["dateStrip"]>;
  selected: string;
  today: string;
  nights: number | null;
  onPick?: (date: string) => void;
}) {
  const days = strip.slice(0, 7);
  if (days.length === 0) return null;
  const priced = days.filter((d) => d.price != null);
  const cheapest = priced.length > 1 ? Math.min(...priced.map((d) => d.price as number)) : null;
  return (
    <div className="mt-6 max-w-full">
    <div aria-label="Prices by departure day" className="max-w-full overflow-x-auto pb-1" role="group">
      <ul className="flex w-max gap-2">
        {days.map((day) => {
          const active = day.date === selected;
          const isCheapest = cheapest != null && day.price === cheapest;
          const past = isPastDay(day.date, today);
          return (
            <li key={day.date}>
              <button
                aria-pressed={active}
                className={`flex h-[60px] min-w-[104px] flex-col items-center justify-center rounded-2xl border px-3 text-center transition ${
                  active
                    ? "border-brandBlue bg-brandBlue text-white"
                    : past
                      ? "border-outline bg-surface text-brandInk opacity-40"
                      : "border-outline bg-surface text-brandInk hover:border-brandBlue/50"
                }`}
                disabled={active || past || !onPick}
                onClick={() => onPick?.(day.date)}
                type="button"
              >
                <span className="text-body-sm font-semibold">{formatStripDay(day.date)}</span>
                <span
                  className={`text-body-sm font-bold ${
                    active ? "text-white" : isCheapest ? "text-emerald-600" : "text-onSurfaceVariant"
                  }`}
                >
                  {day.price == null ? "—" : formatPrice(day.price, day.currency)}
                  {isCheapest ? <span className="sr-only"> (cheapest day)</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
    {nights != null ? (
      <p className="mt-2 text-body-sm text-onSurfaceVariant">
        Prices for a {nights}-night trip
      </p>
    ) : null}
    </div>
  );
}

function OfferCard({
  offer,
  dayLabel,
  picked
}: {
  offer: FlightOffer;
  dayLabel?: string;
  picked?: Pick<FlightForm, "origin" | "destination">;
}) {
  const duration = formatDuration(offer.durationMin);
  return (
    <li className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {dayLabel ? (
            <p className="mb-1 text-body-sm font-semibold text-brandBlue">
              {formatFlightDate(offer.departAt)} · {dayLabel}
            </p>
          ) : null}
          <p className="font-display text-headline-md font-black text-brandInk">
            {formatPrice(offer.price, offer.currency)}
          </p>
          <p className="mt-0.5 text-body-sm text-onSurfaceVariant">
            {airlineLabel(offer)} · {offer.origin} <ArrowRight aria-label="to" className="inline" size={13} /> {offer.destination}
          </p>
          {picked && isOtherAirport(offer, picked) ? (
            <p className="mt-1.5 inline-block rounded-full bg-brandBlue/10 px-2.5 py-0.5 text-body-sm font-semibold text-brandBlue">
              {offer.destination !== picked.destination ? `Lands at ${offer.destination}` : `Departs from ${offer.origin}`}
              {" · other airport"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <a
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brandBlue px-5 text-sm font-bold text-white transition hover:opacity-90"
            href={offer.bookingUrl}
            rel="noopener noreferrer sponsored"
            target="_blank"
          >
            View deal
            <ExternalLink aria-hidden="true" size={15} />
          </a>
          {offer.agency ? <p className="text-body-sm text-onSurfaceVariant">Sold by {offer.agency}</p> : null}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-outline/70 pt-4 sm:grid-cols-4">
        <Leg at={offer.departAt} label="Departs" stops={offer.transfers} />
        {offer.returnAt ? <Leg at={offer.returnAt} label="Returns" stops={offer.returnTransfers} /> : null}
        {duration ? (
          <div>
            <p className="text-label-caps uppercase text-onSurfaceVariant">Duration</p>
            <p className="mt-0.5 text-body-md font-semibold text-brandInk">{duration}</p>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function FlightResults({
  state,
  onPickDate
}: {
  state: SearchState;
  onPickDate?: (date: string) => void;
}) {
  const today = todayIso();
  const strip =
    state.kind === "done" && state.result.dateStrip && state.result.dateStrip.length > 0 ? (
      <DateStrip
        nights={
          state.form.tripType === "round-trip" ? tripNights(state.form.departDate, state.form.returnDate) : null
        }
        onPick={onPickDate}
        selected={state.form.departDate}
        strip={state.result.dateStrip}
        today={today}
      />
    ) : null;
  return (
    <>
      {strip}
      <ResultsBody state={state} />
    </>
  );
}

function ResultsBody({ state }: { state: SearchState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") return <Loading />;

  const notice = "mt-6 rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6";

  if (state.kind === "error") {
    const limited = state.status === 429;
    return (
      <div aria-live="polite" className={notice}>
        <h2 className="font-display text-title-sm font-black text-brandInk">
          {limited ? "Too many searches" : "We couldn't search flights"}
        </h2>
        <p className="mt-1.5 text-body-md text-onSurfaceVariant">
          {limited
            ? "You've searched a lot in a short time. Wait a minute and try again, or search on a partner site."
            : state.message}
        </p>
        <FallbackLinks links={localFallbackLinks(state.form)} />
      </div>
    );
  }

  const { result, form } = state;
  const links = result.fallbackLinks.length > 0 ? result.fallbackLinks : localFallbackLinks(form);

  const nearby = dropPastOffers(result.nearbyOffers ?? [], todayIso());
  if (result.offers.length === 0 && nearby.length > 0) {
    return (
      <section aria-live="polite" className="mt-6">
        <h2 className="font-display text-title-sm font-black text-brandInk">
          {form.tripType === "round-trip"
            ? "No fares for these exact dates — closest trips we found"
            : `No fares on ${formatFlightDate(form.departDate)} — cheapest nearby dates`}
        </h2>
        <ul className="mt-4 grid gap-4">
          {nearby.map((offer, index) => (
            <OfferCard
              dayLabel={dayDiffLabel(form.departDate, offer.departAt)}
              key={`${offer.bookingUrl}-${index}`}
              offer={offer}
              picked={form}
            />
          ))}
        </ul>
        <p className="mt-5 text-body-sm text-onSurfaceVariant">
          Prices were found recently by other travellers and can change. The final price is shown on the partner site
          when you book. You don&apos;t buy anything on eSIM2you, and we may earn a commission if you book.
        </p>
        <p className="mt-3 text-body-sm text-onSurfaceVariant">Want your exact date? Compare live fares:</p>
        <div className="scale-95 origin-left">
          <FallbackLinks links={links} />
        </div>
        <AirlineLinks links={result.airlineLinks} />
      </section>
    );
  }

  if (result.offers.length === 0) {
    return (
      <div aria-live="polite" className={notice}>
        <h2 className="font-display text-title-sm font-black text-brandInk">
          {result.upstreamError ? "Flight prices are unavailable right now" : "No recent fares found"}
        </h2>
        <p className="mt-1.5 text-body-md text-onSurfaceVariant">
          {result.upstreamError
            ? "Our fare source didn't answer. Try again in a moment, or search on a partner site."
            : "Nobody has searched this route and date recently. Try nearby dates or another airport, or check a partner site for live fares."}
        </p>
        <FallbackLinks links={links} />
        <AirlineLinks links={result.airlineLinks} />
      </div>
    );
  }

  return (
    <section aria-live="polite" className="mt-6">
      <h2 className="font-display text-title-sm font-black text-brandInk">
        {result.offers.length} {result.offers.length === 1 ? "fare" : "fares"}, cheapest first
      </h2>
      <ul className="mt-4 grid gap-4">
        {result.offers.map((offer, index) => (
          <OfferCard key={`${offer.bookingUrl}-${index}`} offer={offer} picked={form} />
        ))}
      </ul>
      <p className="mt-5 text-body-sm text-onSurfaceVariant">
        Prices were found recently by other travellers and can change. The final price is shown on the partner site
        when you book. You don&apos;t buy anything on eSIM2you, and we may earn a commission if you book.
      </p>
      <p className="mt-3 text-body-sm text-onSurfaceVariant">Not what you wanted? Compare live fares:</p>
      <FallbackLinks links={links} />
      <AirlineLinks links={result.airlineLinks} />
    </section>
  );
}
