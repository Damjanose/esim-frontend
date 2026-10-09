/** Pure helpers for the /flights page (form validation, query building, display formatting). */

export type TripType = "one-way" | "round-trip";

export type FlightForm = {
  tripType: TripType;
  /** Origin airport IATA code. */
  origin: string;
  /** Destination airport IATA code. */
  destination: string;
  /** YYYY-MM-DD */
  departDate: string;
  /** YYYY-MM-DD, only used for round trips. */
  returnDate: string;
};

export type FlightCountry = { code: string; name: string };
export type FlightAirport = { iata: string; name: string; city: string; cityCode: string };

export type FlightOffer = {
  price: number;
  currency: string;
  airline: string;
  /** Full airline name (absent from older backends, null when unknown). */
  airlineName?: string | null;
  /** Agency selling the fare, e.g. "Kiwi.com" (absent from older backends). */
  agency?: string | null;
  flightNumber: string | null;
  origin: string;
  destination: string;
  departAt: string;
  returnAt: string | null;
  transfers: number;
  returnTransfers: number | null;
  durationMin: number | null;
  bookingUrl: string;
};

export type FlightFallbackLink = { provider: "google" | "skyscanner"; url: string };
export type FlightAirlineLink = { provider: "ryanair" | "easyjet" | "wizzair" | "pegasus"; url: string };

export type FlightSearchResult = {
  offers: FlightOffer[];
  fallbackLinks: FlightFallbackLink[];
  /** Low-cost airlines that never appear in `offers` (absent from older backends). */
  airlineLinks?: FlightAirlineLink[];
  /** Only when `offers` is empty: one cheapest offer per nearby departure date, closest first. */
  nearbyOffers?: FlightOffer[];
  /** Cheapest fare per day around the departure date (price null = no fare found). */
  dateStrip?: Array<{ date: string; price: number | null; currency: string }>;
  pricesAreCached: true;
  upstreamError?: boolean;
};

export const EMPTY_FLIGHT_FORM: FlightForm = {
  tripType: "round-trip",
  origin: "",
  destination: "",
  departDate: "",
  returnDate: ""
};

/** First problem with the form, or null when it can be searched. `today` is YYYY-MM-DD. */
export function flightFormError(form: FlightForm, today: string): string | null {
  if (!form.origin || !form.destination) return "Choose where you are flying from and to.";
  if (form.origin === form.destination) return "Choose two different airports.";
  if (!form.departDate) return "Choose a departure date.";
  if (form.departDate < today) return "The departure date can't be in the past.";
  if (form.tripType === "round-trip") {
    if (!form.returnDate) return "Choose a return date, or switch to one-way.";
    if (form.returnDate < form.departDate) return "The return date must be on or after departure.";
  }
  return null;
}

export function canSearch(form: FlightForm, today: string): boolean {
  return flightFormError(form, today) === null;
}

/** Query string for /bff/flights/search. The return date is dropped for one-way trips. */
export function buildSearchQuery(form: FlightForm): string {
  const params = new URLSearchParams({
    origin: form.origin,
    destination: form.destination,
    departDate: form.departDate
  });
  if (form.tripType === "round-trip" && form.returnDate) {
    params.set("returnDate", form.returnDate);
  }
  return params.toString();
}

/** 425 -> "7h 5m", 60 -> "1h", 45 -> "45m", unknown -> "". */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatStops(stops: number | null | undefined): string {
  if (stops == null) return "";
  if (stops === 0) return "Direct";
  return stops === 1 ? "1 stop" : `${stops} stops`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "5 Nov, 09:30" from an ISO datetime, read as written (the wall-clock time at the
 * airport) so the visitor's time zone never shifts it. "" when unparseable.
 */
export function formatFlightTime(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso ?? "");
  if (!match) return "";
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return "";
  return `${Number(match[3])} ${month}, ${match[4]}:${match[5]}`;
}

/** "USD" 412 -> "$412"-style via Intl, falling back to "412 USD". */
export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

/** "2 days earlier" / "3 days later" / "Same day" for an offer's departure vs the chosen YYYY-MM-DD date. */
/** "Wizz Air UK · W9 5460", or just the code + flight number when the name is unknown. */
export function airlineLabel(offer: Pick<FlightOffer, "airline" | "airlineName" | "flightNumber">): string {
  const code = [offer.airline, offer.flightNumber].filter(Boolean).join(" ");
  const name = offer.airlineName?.trim();
  return name && code ? `${name} · ${code}` : name || code;
}

export function dayDiffLabel(chosenDate: string, departAt: string): string {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(chosenDate);
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(departAt ?? "");
  if (!a || !b) return "";
  const days = Math.round(
    (Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86_400_000
  );
  if (days === 0) return "Same day";
  const n = Math.abs(days);
  return `${n} ${n === 1 ? "day" : "days"} ${days < 0 ? "earlier" : "later"}`;
}

/** "5 Nov" from an ISO date or datetime, read as written. "" when unparseable. */
export function formatFlightDate(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${Number(match[3])} ${month}` : "";
}

/** Adds whole days to a YYYY-MM-DD date (UTC math). Returns the input when unparseable. */
export function shiftDate(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + days)).toISOString().slice(0, 10);
}

/** New departure date; a round trip's return date moves by the same number of days (trip length kept). */
export function withDepartDate(form: FlightForm, departDate: string): FlightForm {
  if (form.tripType !== "round-trip" || !form.returnDate || !form.departDate) return { ...form, departDate };
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(form.departDate);
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(departDate);
  if (!a || !b) return { ...form, departDate };
  const days = Math.round((Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86_400_000);
  return { ...form, departDate, returnDate: shiftDate(form.returnDate, days) };
}

/** True when the YYYY-MM-DD date is before `today` (also YYYY-MM-DD). Unparseable dates are not past. */
export function isPastDay(date: string, today: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{4}-\d{2}-\d{2}$/.test(today) && date < today;
}

/** Offers departing before `today` (by the date part of departAt). */
export function dropPastOffers<T extends { departAt: string }>(offers: T[], today: string): T[] {
  return offers.filter((o) => !isPastDay(o.departAt.slice(0, 10), today));
}

/** Whole nights between two YYYY-MM-DD dates, or null when unparseable or not positive. */
export function tripNights(departDate: string, returnDate: string): number | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(departDate);
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(returnDate);
  if (!a || !b) return null;
  const n = Math.round((Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86_400_000);
  return n > 0 ? n : null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Wed 28 Oct" from YYYY-MM-DD. "" when unparseable. */
export function formatStripDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  if (!m || !month) return "";
  const weekday = WEEKDAYS[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];
  return `${weekday} ${Number(m[3])} ${month}`;
}

/** True when the offer uses a different airport than the user picked (same-city alternative). */
export function isOtherAirport(
  offer: Pick<FlightOffer, "origin" | "destination">,
  picked: Pick<FlightForm, "origin" | "destination">
): boolean {
  return offer.origin !== picked.origin || offer.destination !== picked.destination;
}
