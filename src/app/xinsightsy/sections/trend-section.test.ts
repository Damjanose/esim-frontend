import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(`src/app/xinsightsy/${path}`, "utf8");

describe("daily trend", () => {
  it("reads the daily report and draws visitors as a line and orders as bars, with no chart library", () => {
    const text = read("sections/TrendSection.tsx");
    expect(text).toContain('useInsightsReport<DailyData>("daily"');
    expect(text).toContain("<svg");
    expect(text).toContain("linePath(");
    expect(text).toContain("trendGeometry(");
    expect(text).not.toMatch(/from "(recharts|chart\.js|d3|victory|nivo)/);
  });

  it("scrolls sideways on a phone rather than squeezing the days", () => {
    const text = read("sections/TrendSection.tsx");
    expect(text).toContain("overflow-x-auto");
    expect(text).toContain("chartWidth(");
  });

  it("loads chart notes for the same range from the BFF and shows them as markers", () => {
    const hook = read("useChartNotes.ts");
    expect(hook).toContain("/bff/admin/insights/chart-notes?");
    expect(hook).toContain("Authorization: `Bearer ${token}`");
    expect(hook).toContain("unauthorized.current?.()");
    const text = read("sections/TrendSection.tsx");
    expect(text).toContain("useChartNotes(");
    expect(text).toContain("noteMarkers(");
    expect(text).toContain("group-focus-within:block");
    expect(text).toContain("group-hover:block");
  });

  it("draws a visible point when there is only one day", () => {
    const text = read("sections/TrendSection.tsx");
    expect(text).toContain("<circle");
    expect(text).toContain("days.length === 1");
  });

  it("gives one marker per date, using noteMarkers", () => {
    const text = read("sections/TrendSection.tsx");
    expect(text).toContain("noteMarkers(");
    expect(text).not.toContain("notePositions(");
  });

  it("makes holidays look different from admin notes", () => {
    const text = read("sections/TrendSection.tsx");
    expect(text).toContain("readOnly");
    expect(text).toContain("border-dashed");
    expect(text).toContain("Holiday");
  });
});
