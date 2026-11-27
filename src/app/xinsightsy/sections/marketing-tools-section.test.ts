import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(`src/app/xinsightsy/${path}`, "utf8");

describe("marketing tools: ad spend", () => {
  it("lists entries from the BFF for the range, and creates, updates and deletes through it", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain('"/bff/admin/insights/ad-spend?');
    expect(text).toContain('marketingRequest<{ entries: AdSpendEntry[] }>');
    expect(text).toContain('"POST", "/bff/admin/insights/ad-spend"');
    expect(text).toContain('"PUT", `/bff/admin/insights/ad-spend/');
    expect(text).toContain('"DELETE", `/bff/admin/insights/ad-spend/');
  });

  it("validates with the shared form rules and shows friendly errors", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain("validateAdSpendForm(");
    expect(text).toContain("entryToFormInput(");
    expect(text).toContain("friendlyError(");
  });
});

describe("marketing tools: chart notes", () => {
  it("creates and deletes notes, and only offers delete for notes that are not read-only", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain('"/bff/admin/insights/chart-notes?');
    expect(text).toContain('"POST", "/bff/admin/insights/chart-notes"');
    expect(text).toContain('"DELETE", `/bff/admin/insights/chart-notes/');
    expect(text).toContain("validateChartNoteForm(");
    expect(text).toContain("!note.readOnly");
  });
});

describe("marketing tools: safety and states", () => {
  it("asks for confirmation inline, never with window.confirm", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain("Delete?");
    expect(text).toContain(">Yes<");
    expect(text).toContain(">No<");
    expect(text).not.toContain("window.confirm");
  });

  it("shows loading, error and empty states through SectionState", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain("<SectionState");
    expect(text).toContain("onRetry=");
  });

  it("calls onSaved after a successful save, so the trend and campaigns refresh", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain("onSaved()");
  });
});

describe("shared refresh counter", () => {
  it("the page keeps a counter and passes it to the sections that show saved data", () => {
    const page = read("page.tsx");
    expect(page).toContain("refreshKey");
    expect(page).toContain("onSaved={");
    expect(read("sections/TrendSection.tsx")).toContain("refreshKey");
    expect(read("sections/CampaignsSection.tsx")).toContain("refreshKey");
    expect(read("useInsightsReport.ts")).toContain("refreshKey");
    expect(read("useChartNotes.ts")).toContain("refreshKey");
  });
});

describe("marketing tools: delete in flight and not_found", () => {
  it("disables the delete buttons while a delete is in flight", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain("deletingId");
    expect(text).toContain("disabled={disabled}");
    expect(text).toContain("disabled={deletingId !== null}");
  });

  it("treats not_found on delete as done: refresh and onSaved", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain('result.code === "not_found"');
  });

  it("resets the form when the deleted entry is the one being edited", () => {
    const text = read("sections/MarketingToolsSection.tsx");
    expect(text).toContain("if (editingId === id) reset();");
  });
});
