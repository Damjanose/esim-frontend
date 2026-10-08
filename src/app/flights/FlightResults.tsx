"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { ArrowRight, ExternalLink } from "lucide-react";
import flightLoaderAnimation from "@/../public/lottie/Flight-loader.json";
import {
  formatDuration,
  formatFlightTime,
  formatPrice,
  formatStops,
  type FlightFallbackLink,
  type FlightForm,
  type FlightOffer,
  type FlightSearchResult
} from "@/lib/flightSearch";

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

function OfferCard({ offer }: { offer: FlightOffer }) {
  const duration = formatDuration(offer.durationMin);
  return (
    <li className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="font-display text-headline-md font-black text-brandInk">
            {formatPrice(offer.price, offer.currency)}
          </p>
          <p className="mt-0.5 text-body-sm text-onSurfaceVariant">
            {offer.airline}
            {offer.flightNumber ? ` ${offer.flightNumber}` : ""} · {offer.origin} <ArrowRight aria-label="to" className="inline" size={13} /> {offer.destination}
          </p>
        </div>
        <a
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brandBlue px-5 text-sm font-bold text-white transition hover:opacity-90"
          href={offer.bookingUrl}
          rel="noopener noreferrer sponsored"
          target="_blank"
        >
          View deal
          <ExternalLink aria-hidden="true" size={15} />
        </a>
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

export function FlightResults({ state }: { state: SearchState }) {
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
          <OfferCard key={`${offer.bookingUrl}-${index}`} offer={offer} />
        ))}
      </ul>
      <p className="mt-5 text-body-sm text-onSurfaceVariant">
        Prices were found recently by other travellers and can change. The final price is shown on the partner site
        when you book. You don&apos;t buy anything on eSIM2you, and we may earn a commission if you book.
      </p>
      <p className="mt-3 text-body-sm text-onSurfaceVariant">Not what you wanted? Compare live fares:</p>
      <FallbackLinks links={links} />
    </section>
  );
}
