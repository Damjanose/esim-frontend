import { describe, expect, it } from "vitest";
import {
  airlineLabel,
  buildSearchQuery,
  canSearch,
  flightFormError,
  formatDuration,
  formatFlightTime,
  formatStops,
  dayDiffLabel,
  formatStripDay,
  isOtherAirport,
  isPastDay,
  dropPastOffers,
  tripNights,
  shiftDate,
  withDepartDate,
  type FlightForm,
  type FlightOffer
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

describe("dayDiffLabel", () => {
  it("labels earlier and later dates", () => {
    expect(dayDiffLabel("2026-11-05", "2026-11-03T09:30:00")).toBe("2 days earlier");
    expect(dayDiffLabel("2026-11-05", "2026-11-08T21:00:00+01:00")).toBe("3 days later");
  });
  it("uses singular and handles same day / bad input", () => {
    expect(dayDiffLabel("2026-11-05", "2026-11-04T10:00:00")).toBe("1 day earlier");
    expect(dayDiffLabel("2026-11-05", "2026-11-06T10:00:00")).toBe("1 day later");
    expect(dayDiffLabel("2026-11-05", "2026-11-05T10:00:00")).toBe("Same day");
    expect(dayDiffLabel("2026-11-05", "nope")).toBe("");
  });
});

describe("shiftDate / withDepartDate", () => {
  it("shifts across month and year boundaries", () => {
    expect(shiftDate("2026-10-30", 3)).toBe("2026-11-02");
    expect(shiftDate("2026-01-02", -3)).toBe("2025-12-30");
    expect(shiftDate("bad", 1)).toBe("bad");
  });

  it("keeps trip length for round trips", () => {
    const next = withDepartDate(form({ departDate: "2026-11-05", returnDate: "2026-11-12" }), "2026-11-03");
    expect(next.departDate).toBe("2026-11-03");
    expect(next.returnDate).toBe("2026-11-10");
  });

  it("leaves one-way and empty return dates alone", () => {
    expect(withDepartDate(form({ tripType: "one-way", returnDate: "2026-11-12" }), "2026-11-06").returnDate).toBe(
      "2026-11-12"
    );
    expect(withDepartDate(form({ returnDate: "" }), "2026-11-06").returnDate).toBe("");
  });
});

describe("formatStripDay", () => {
  it("formats weekday, day and month", () => {
    expect(formatStripDay("2026-10-28")).toBe("Wed 28 Oct");
    expect(formatStripDay("nope")).toBe("");
  });
});

describe("isOtherAirport", () => {
  const offer = { origin: "TIA", destination: "MXP" } as FlightOffer;
  it("is false when both airports match", () => {
    expect(isOtherAirport(offer, { origin: "TIA", destination: "MXP" })).toBe(false);
  });
  it("is true when either side differs", () => {
    expect(isOtherAirport(offer, { origin: "TIA", destination: "BGY" })).toBe(true);
    expect(isOtherAirport(offer, { origin: "FCO", destination: "MXP" })).toBe(true);
  });
});

describe("isPastDay / dropPastOffers / tripNights", () => {
  it("flags only days before today", () => {
    expect(isPastDay("2026-10-08", "2026-10-09")).toBe(true);
    expect(isPastDay("2026-10-09", "2026-10-09")).toBe(false);
    expect(isPastDay("2026-10-10", "2026-10-09")).toBe(false);
    expect(isPastDay("garbage", "2026-10-09")).toBe(false);
  });
  it("drops offers departing before today", () => {
    const offers = [{ departAt: "2026-10-08T10:00:00" }, { departAt: "2026-10-09T10:00:00" }];
    expect(dropPastOffers(offers, "2026-10-09")).toEqual([offers[1]]);
  });
  it("counts nights", () => {
    expect(tripNights("2026-10-10", "2026-10-17")).toBe(7);
    expect(tripNights("2026-10-10", "2026-10-10")).toBeNull();
    expect(tripNights("x", "2026-10-10")).toBeNull();
  });
});

describe("airlineLabel", () => {
  it("prefixes the airline name to the code and flight number", () => {
    expect(airlineLabel({ airline: "W9", airlineName: "Wizz Air UK", flightNumber: "5460" })).toBe("Wizz Air UK · W9 5460");
  });
  it("falls back to the code when the name is unknown or missing", () => {
    expect(airlineLabel({ airline: "W9", airlineName: null, flightNumber: "5460" })).toBe("W9 5460");
    expect(airlineLabel({ airline: "W9", flightNumber: null })).toBe("W9");
    expect(airlineLabel({ airline: "", airlineName: "Wizz Air", flightNumber: null })).toBe("Wizz Air");
  });
});
