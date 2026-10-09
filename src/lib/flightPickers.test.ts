import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  calendarWeeks,
  filterAirports,
  filterCountries,
  flagUrl,
  pickCalendarDate
} from "./flightPickers";

describe("flagUrl", () => {
  it("builds a lowercase flagcdn URL for ISO codes", () => {
    expect(flagUrl("GB")).toBe("https://flagcdn.com/w80/gb.png");
  });
  it("returns null for anything that isn't two letters", () => {
    expect(flagUrl("")).toBeNull();
    expect(flagUrl("GBR")).toBeNull();
  });
});

describe("filterCountries", () => {
  const countries = [
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "GB", name: "United Kingdom" },
    { code: "NL", name: "Netherlands" },
    { code: "AX", name: "Åland Islands" }
  ];
  it("returns everything for an empty query", () => {
    expect(filterCountries(countries, "  ")).toBe(countries);
  });
  it("puts name prefixes before substring matches", () => {
    expect(filterCountries(countries, "a").map((c) => c.code)).toEqual(["AL", "DZ", "AX", "NL"]);
  });
  it("matches an exact country code and ignores accents", () => {
    expect(filterCountries(countries, "gb").map((c) => c.code)).toEqual(["GB"]);
    expect(filterCountries(countries, "aland").map((c) => c.code)).toEqual(["AX"]);
  });
});

describe("filterAirports", () => {
  const airports = [
    { iata: "LTN", name: "Luton", city: "London", cityCode: "LON" },
    { iata: "LGW", name: "Gatwick", city: "London", cityCode: "LON" },
    { iata: "MAN", name: "Manchester", city: "Manchester", cityCode: "MAN" }
  ];
  it("ranks an exact IATA match first", () => {
    expect(filterAirports(airports, "man").map((a) => a.iata)).toEqual(["MAN"]);
    expect(filterAirports(airports, "lgw").map((a) => a.iata)).toEqual(["LGW"]);
  });
  it("matches city and airport name", () => {
    expect(filterAirports(airports, "london").map((a) => a.iata)).toEqual(["LTN", "LGW"]);
    expect(filterAirports(airports, "gat").map((a) => a.iata)).toEqual(["LGW"]);
  });
});

describe("calendar helpers", () => {
  it("lays out October 2026 Monday-first", () => {
    const weeks = calendarWeeks(2026, 9);
    // 1 Oct 2026 is a Thursday.
    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weeks.at(-1)?.filter(Boolean).at(-1)).toBe("2026-10-31");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });
  it("wraps months across years", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("pickCalendarDate", () => {
  const round = { tripType: "round-trip" as const, departDate: "", returnDate: "" };
  it("one-way: sets the departure and closes", () => {
    expect(pickCalendarDate({ ...round, tripType: "one-way" }, "depart", "2026-11-02")).toEqual({
      departDate: "2026-11-02",
      returnDate: "",
      next: null
    });
  });
  it("round trip: departure first, then moves on to the return", () => {
    expect(pickCalendarDate(round, "depart", "2026-11-02")).toEqual({
      departDate: "2026-11-02",
      returnDate: "",
      next: "return"
    });
  });
  it("round trip: a return on or after departure completes the range", () => {
    expect(pickCalendarDate({ ...round, departDate: "2026-11-02" }, "return", "2026-11-09")).toEqual({
      departDate: "2026-11-02",
      returnDate: "2026-11-09",
      next: null
    });
  });
  it("round trip: a return before departure becomes the new departure", () => {
    expect(pickCalendarDate({ ...round, departDate: "2026-11-10" }, "return", "2026-11-05")).toEqual({
      departDate: "2026-11-05",
      returnDate: "",
      next: "return"
    });
  });
  it("round trip: changing departure keeps a later return and closes", () => {
    const form = { ...round, departDate: "2026-11-02", returnDate: "2026-11-09" };
    expect(pickCalendarDate(form, "depart", "2026-11-04")).toEqual({
      departDate: "2026-11-04",
      returnDate: "2026-11-09",
      next: null
    });
    expect(pickCalendarDate(form, "depart", "2026-11-12")).toEqual({
      departDate: "2026-11-12",
      returnDate: "",
      next: "return"
    });
  });
});
