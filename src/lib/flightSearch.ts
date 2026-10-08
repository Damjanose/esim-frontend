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

export type FlightSearchResult = {
  offers: FlightOffer[];
  fallbackLinks: FlightFallbackLink[];
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
