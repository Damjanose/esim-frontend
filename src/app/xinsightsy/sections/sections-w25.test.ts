import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(`src/app/xinsightsy/sections/${path}`, "utf8");

describe("seasons", () => {
  it("reads the seasons report, draws monthly order bars, and groups chart notes by month", () => {
    const text = read("SeasonsSection.tsx");
    expect(text).toContain('useInsightsReport<SeasonsData>("seasons"');
    expect(text).toContain("monthBarHeights(");
    expect(text).toContain("groupNotesByMonth(");
    expect(text).toContain("useChartNotes(");
    expect(text).toContain("formatMoney(");
  });
});

describe("acquisition", () => {
  it("reads the acquisition report with a bar list, the other texts, and the self-reported note", () => {
    const text = read("AcquisitionSection.tsx");
    expect(text).toContain('useInsightsReport<AcquisitionData>("acquisition"');
    expect(text).toContain("<BarList");
    expect(text).toContain("acquisitionBarRows(");
    expect(text).toContain("otherTexts");
    expect(text).toContain("Self-reported answers");
  });
});
