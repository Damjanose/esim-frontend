import { describe, expect, it } from "vitest";
import {
  buildSearchQuery,
  canSearch,
  flightFormError,
  formatDuration,
  formatFlightTime,
  formatStops,
  type FlightForm
} from "./flightSearch";

function form(overrides: Partial<FlightForm> = {}): FlightForm {
  return {
    tripType: "round-trip",
    origin: "LHR",
    destination: "JFK",
    departDate: "2026-11-05",
    returnDate: "2026-11-12",
    ...overrides
  };
}

const TODAY = "2026-10-09";

describe("flightFormError / canSearch", () => {
  it("accepts a complete round trip", () => {
    expect(flightFormError(form(), TODAY)).toBeNull();
    expect(canSearch(form(), TODAY)).toBe(true);
  });

  it("needs both airports, and they must differ", () => {
    expect(canSearch(form({ origin: "" }), TODAY)).toBe(false);
    expect(canSearch(form({ destination: "" }), TODAY)).toBe(false);
    expect(flightFormError(form({ destination: "LHR" }), TODAY)).toMatch(/different/i);
  });

  it("rejects past departure dates but allows today", () => {
    expect(canSearch(form({ departDate: "2026-10-08", returnDate: "" , tripType: "one-way"}), TODAY)).toBe(false);
    expect(canSearch(form({ departDate: TODAY, tripType: "one-way" }), TODAY)).toBe(true);
  });

  it("requires a return date on or after departure for round trips", () => {
    expect(canSearch(form({ returnDate: "" }), TODAY)).toBe(false);
    expect(canSearch(form({ returnDate: "2026-11-04" }), TODAY)).toBe(false);
    expect(canSearch(form({ returnDate: "2026-11-05" }), TODAY)).toBe(true);
  });

  it("ignores the return date for one-way", () => {
    expect(canSearch(form({ tripType: "one-way", returnDate: "" }), TODAY)).toBe(true);
  });
});

describe("buildSearchQuery", () => {
  it("includes the return date for round trips", () => {
    expect(buildSearchQuery(form())).toBe("origin=LHR&destination=JFK&departDate=2026-11-05&returnDate=2026-11-12");
  });

  it("omits the return date for one-way, even if one is still in the form", () => {
    expect(buildSearchQuery(form({ tripType: "one-way" }))).toBe(
      "origin=LHR&destination=JFK&departDate=2026-11-05"
    );
  });
});

describe("formatters", () => {
  it("formats duration", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(425)).toBe("7h 5m");
  });

  it("formats stops", () => {
    expect(formatStops(0)).toBe("Direct");
    expect(formatStops(1)).toBe("1 stop");
    expect(formatStops(2)).toBe("2 stops");
    expect(formatStops(null)).toBe("");
  });

  it("formats the airport-local date and time without shifting zones", () => {
    expect(formatFlightTime("2026-11-05T09:30:00+01:00")).toBe("5 Nov, 09:30");
    expect(formatFlightTime("2026-11-05T21:05:00.000Z")).toBe("5 Nov, 21:05");
    expect(formatFlightTime("garbage")).toBe("");
  });
});
