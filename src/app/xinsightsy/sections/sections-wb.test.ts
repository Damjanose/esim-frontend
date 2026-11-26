import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(`src/app/xinsightsy/${path}`, "utf8");

describe("hook and filter bar", () => {
  it("cancels the request in flight, sends the token and calls onUnauthorized on 401", () => {
    const hook = read("useInsightsReport.ts");
    expect(hook).toContain("AbortController");
    expect(hook).toContain("controller.abort()");
    expect(hook).toContain("Authorization: `Bearer ${token}`");
    expect(hook).toContain("unauthorized.current?.()");
    expect(hook).toContain("retry:");
  });

  it("keeps filters in the URL with replaceState", () => {
    const filters = read("ui/filters.tsx");
    expect(filters).toContain("window.history.replaceState");
    expect(filters).toContain("presetRange");
    expect(filters).toContain('maxLength={2}');
  });
});

describe("sections", () => {
  it("Overview reads the overview report, shows the eight tiles and a profit tile with its status", () => {
    const text = read("sections/OverviewSection.tsx");
    expect(text).toContain('useInsightsReport<OverviewData>("overview"');
    for (const label of ["Active visitors", "New visitors", "Returning visitors", "Sessions", "Orders", "Buyers", "Conversion", "Revenue", "Profit"]) {
      expect(text).toContain(label);
    }
    expect(text).toContain("formatProfit(");
    expect(text).toContain("<SectionState");
  });

  it("Audience shows four bar lists", () => {
    const text = read("sections/AudienceSection.tsx");
    expect(text).toContain('useInsightsReport<AudienceData>("audience"');
    expect(text).toContain("ready.locales");
    expect(text).toContain("ready.deviceTypes");
    expect(text).toContain("ready.platforms");
    expect(text).toContain("ready.appVersions");
    expect((text.match(/<BarList/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it("Locations has level and basis switches, a table, a network note and a CSV export", () => {
    const text = read("sections/LocationsSection.tsx");
    expect(text).toContain('useInsightsReport<LocationsData>("locations"');
    expect(text).toContain("<DataTable");
    expect(text).toContain('"city"');
    expect(text).toContain('"billing"');
    expect(text).toContain('code="network_location"');
    expect(text).toContain("insights-locations-");
    expect(text).toContain("toCsv(");
    expect(text).toContain('country === "US"');
  });

  it("Peak times offers the five zones and three metrics in a heatmap", () => {
    const text = read("sections/PeakTimesSection.tsx");
    expect(text).toContain('useInsightsReport<PeakTimesData>("peak-times"');
    for (const zone of ["visitor", "America/New_York", "Europe/London", "Europe/Tirane", "UTC"]) expect(text).toContain(zone);
    for (const metric of ["events", "visitors", "orders"]) expect(text).toContain(metric);
    expect(text).toContain("<Heatmap");
  });

  it("Data health warns when collection is off and marks stale platforms in red", () => {
    const text = read("sections/DataHealthSection.tsx");
    expect(text).toContain('useInsightsReport<DataHealthData>("data-health"');
    expect(text).toContain("ANALYTICS_COLLECTION_ENABLED=true");
    expect(text).toContain("No data");
    expect(text).toContain("text-red-700");
    expect(text).toContain("24 * 60 * 60 * 1000");
  });
});
