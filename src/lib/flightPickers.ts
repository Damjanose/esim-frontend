/** Pure helpers for the /flights place and date pickers. Dates are YYYY-MM-DD strings. */

import type { FlightAirport, FlightCountry, FlightForm } from "./flightSearch";

/** flagcdn image for an ISO 3166-1 alpha-2 code, or null for anything else. */
export function flagUrl(code: string): string | null {
  return /^[A-Za-z]{2}$/.test(code) ? `https://flagcdn.com/w80/${code.toLowerCase()}.png` : null;
}

const norm = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Countries matching `query` by name or code; names that start with it come first. */
export function filterCountries(countries: FlightCountry[], query: string): FlightCountry[] {
  const q = norm(query);
  if (!q) return countries;
  const starts: FlightCountry[] = [];
  const rest: FlightCountry[] = [];
  for (const country of countries) {
    const name = norm(country.name);
    if (name.startsWith(q) || norm(country.code) === q) starts.push(country);
    else if (name.includes(q)) rest.push(country);
  }
  return [...starts, ...rest];
}

/** Airports matching `query` by IATA code, city or name; an exact code match comes first. */
export function filterAirports(airports: FlightAirport[], query: string): FlightAirport[] {
  const q = norm(query);
  if (!q) return airports;
  const exact: FlightAirport[] = [];
  const rest: FlightAirport[] = [];
  for (const airport of airports) {
    if (norm(airport.iata) === q) exact.push(airport);
    else if ([airport.iata, airport.city, airport.name].some((field) => norm(field).includes(q))) rest.push(airport);
  }
  return [...exact, ...rest];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function isoOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** `{ year, month }` (month 0-11) of a YYYY-MM-DD string. */
export function monthOf(iso: string): { year: number; month: number } {
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) - 1 };
}

export function addMonths(view: { year: number; month: number }, delta: number): { year: number; month: number } {
  const index = view.year * 12 + view.month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

/** Adds `days` to a YYYY-MM-DD date (UTC arithmetic, so no DST drift). */
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday-first weeks of a month as ISO dates, null for the padding cells. */
export function calendarWeeks(year: number, month: number): Array<Array<string | null>> {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const lead = (first + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= days; day++) cells.push(isoOf(year, month, day));
  while (cells.length % 7) cells.push(null);
  const weeks: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export type DateField = "depart" | "return";

/**
 * Applies a calendar click. Picking the departure on a round trip moves on to the
 * return (`next: "return"`); a return before the departure becomes the new departure
 * instead. `next: null` means the picker can close.
 */
export function pickCalendarDate(
  form: Pick<FlightForm, "tripType" | "departDate" | "returnDate">,
  field: DateField,
  date: string
): { departDate: string; returnDate: string; next: DateField | null } {
  const roundTrip = form.tripType === "round-trip";
  if (field === "return" && roundTrip && form.departDate && date >= form.departDate) {
    return { departDate: form.departDate, returnDate: date, next: null };
  }
  const returnDate = roundTrip && form.returnDate && form.returnDate >= date ? form.returnDate : "";
  if (!roundTrip) return { departDate: date, returnDate: "", next: null };
  return { departDate: date, returnDate, next: field === "depart" && returnDate ? null : "return" };
}
