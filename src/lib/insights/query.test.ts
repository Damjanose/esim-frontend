import { describe, expect, it } from "vitest";
import {
  dayCount,
  defaultFilters,
  insightsReportUrl,
  parseFilters,
  presetRange,
  serializeFilters,
  type InsightsFilters
} from "./query";

const TODAY = "2026-11-26";

describe("defaults and presets", () => {
  it("defaults to the last 28 days including today", () => {
    expect(defaultFilters(TODAY)).toMatchObject({ from: "2026-10-30", to: "2026-11-26", platform: "all", country: "all", compare: false });
  });

  it.each([
    ["7", 7],
    ["28", 28],
    ["90", 90]
  ])("preset %s covers %i days ending today", (preset, days) => {
    const range = presetRange(preset as "7" | "28" | "90", TODAY);
    expect(range.to).toBe(TODAY);
    expect(dayCount(range.from, range.to)).toBe(days);
  });

  it("this month starts on the first and ends today", () => {
    expect(presetRange("this-month", TODAY)).toEqual({ from: "2026-11-01", to: "2026-11-26" });
  });

  it("last month is the whole previous month", () => {
    expect(presetRange("last-month", TODAY)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  });
});

describe("URL round trip", () => {
  it("parses what it serialises", () => {
    const filters: InsightsFilters = { from: "2026-11-01", to: "2026-11-07", platform: "ios", country: "US", compare: true };
    expect(parseFilters(serializeFilters(filters), TODAY)).toEqual(filters);
  });

  it("uses the defaults for an empty query", () => {
    expect(parseFilters(new URLSearchParams(), TODAY)).toEqual(defaultFilters(TODAY));
  });

  it("falls back to the defaults for invalid values", () => {
    const defaults = defaultFilters(TODAY);
    expect(parseFilters(new URLSearchParams("from=2026-13-40&to=2026-11-07"), TODAY).from).toBe(defaults.from);
    expect(parseFilters(new URLSearchParams("from=2026-11-10&to=2026-11-01"), TODAY)).toEqual(defaults);
    expect(parseFilters(new URLSearchParams("platform=windows"), TODAY).platform).toBe("all");
    expect(parseFilters(new URLSearchParams("country=USA"), TODAY).country).toBe("all");
  });

  it("upper-cases a valid country code", () => {
    expect(parseFilters(new URLSearchParams("country=us"), TODAY).country).toBe("US");
  });

  it("turns compare on only for 1", () => {
    expect(parseFilters(new URLSearchParams("compare=1"), TODAY).compare).toBe(true);
    expect(parseFilters(new URLSearchParams("compare=yes"), TODAY).compare).toBe(false);
  });

  it("rejects a range longer than 400 days", () => {
    expect(parseFilters(new URLSearchParams("from=2024-01-01&to=2026-11-26"), TODAY)).toEqual(defaultFilters(TODAY));
  });
});

describe("insightsReportUrl", () => {
  it("builds the BFF URL with the filters and extra options", () => {
    const filters = { ...defaultFilters(TODAY), compare: true };
    const url = insightsReportUrl("locations", filters, { level: "city", basis: "billing" });
    expect(url).toBe(
      "/bff/admin/insights/locations?from=2026-10-30&to=2026-11-26&platform=all&country=all&compare=1&level=city&basis=billing"
    );
  });

  it("leaves compare out when it is off", () => {
    expect(insightsReportUrl("overview", defaultFilters(TODAY))).not.toContain("compare");
  });
});
