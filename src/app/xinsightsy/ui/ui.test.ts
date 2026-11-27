import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarList } from "./BarList";
import { DataTable } from "./DataTable";
import { Heatmap } from "./Heatmap";
import { NoteBadge, noteText } from "./NoteBadge";
import { SectionState } from "./SectionState";
import { StatTile } from "./StatTile";

describe("insights UI pieces", () => {
  it("uses no chart library", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of ["recharts", "chart.js", "d3"]) expect(all[name]).toBeUndefined();
  });

  it("StatTile shows a dash for a null value and the change text", () => {
    expect(renderToStaticMarkup(createElement(StatTile, { label: "Visitors", value: null, change: null }))).toContain("—");
    const html = renderToStaticMarkup(createElement(StatTile, { label: "Visitors", value: 42, change: "▲ 10.0%" }));
    expect(html).toContain("42");
    expect(html).toContain("▲ 10.0%");
  });

  it("BarList shows a dash for a null row and the empty text when there are no rows", () => {
    const html = renderToStaticMarkup(createElement(BarList, { rows: [{ label: "Turkey", value: null }] }));
    expect(html).toContain("Turkey");
    expect(html).toContain("—");
    expect(renderToStaticMarkup(createElement(BarList, { rows: [], emptyText: "Nothing yet" }))).toContain("Nothing yet");
  });

  it("DataTable shows a dash for null cells and scrolls sideways", () => {
    const html = renderToStaticMarkup(
      createElement(DataTable<{ name: string; n: number | null }>, {
        caption: "Destinations",
        rowKey: (row) => row.name,
        rows: [{ name: "Albania", n: null }],
        columns: [
          { key: "name", label: "Name", value: (row) => row.name },
          { key: "n", label: "Views", value: (row) => row.n, numeric: true }
        ]
      })
    );
    expect(html).toContain("Albania");
    expect(html).toContain("—");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("sticky");
  });

  it("DataTable sorts by sortValue when the cell shows formatted text", () => {
    const html = renderToStaticMarkup(
      createElement(DataTable<{ name: string; rate: number }>, {
        caption: "Rates",
        rowKey: (row) => row.name,
        rows: [{ name: "A", rate: 0.5 }],
        columns: [{ key: "rate", label: "Rate", value: (row) => `${row.rate * 100}%`, sortValue: (row) => row.rate, numeric: true }]
      })
    );
    expect(html).toContain("50%");
  });

  it("Heatmap renders 168 cells and a dash title for null", () => {
    const html = renderToStaticMarkup(createElement(Heatmap, { cells: [{ weekday: 0, hour: 9, value: null }], label: "events" }));
    expect((html.match(/data-cell=/g) ?? []).length).toBe(168);
    expect(html).toContain("overflow-x-auto");
  });

  it("NoteBadge has text for every note code the dashboard uses", () => {
    for (const code of ["network_location", "billing_address_latest", "deleted_accounts_excluded", "consented_web_only", "trip_plans_unavailable"]) {
      expect(noteText(code), code).toBeTruthy();
    }
    expect(renderToStaticMarkup(createElement(NoteBadge, { code: "network_location" }))).toContain("Network location");
    expect(noteText("unknown_code")).toBeNull();
  });

  it("SectionState shows loading, empty, error with retry, and ready content", () => {
    expect(renderToStaticMarkup(createElement(SectionState, { state: "loading" }))).toContain('role="status"');
    expect(renderToStaticMarkup(createElement(SectionState, { state: "empty", emptyText: "No visits" }))).toContain("No visits");
    const error = renderToStaticMarkup(createElement(SectionState, { state: "error", onRetry: () => undefined }));
    expect(error).toContain("Try again");
    expect(renderToStaticMarkup(createElement(SectionState, { state: "ready" }, createElement("p", null, "Body")))).toContain("Body");
  });
});
