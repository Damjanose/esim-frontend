import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = __dirname;
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

describe("create from template wiring", () => {
  it("list page offers promo, match giveaway and blank", () => {
    const page = read("page.tsx");
    expect(page).toContain('href="/xeventsy/new?template=promo"');
    expect(page).toContain('href="/xeventsy/new?template=match"');
    expect(page).toContain('href="/xeventsy/new"');
  });

  it("editor route reads the template search param and seeds the draft", () => {
    const route = read("[id]", "page.tsx");
    expect(route).toContain("searchParams");
    expect(route).toContain("parseTemplate");
    const shell = read("editor", "EditorShell.tsx");
    expect(shell).toContain("draftForTemplate");
  });
});

describe("results page wiring", () => {
  it("list shows a Results link only for giveaways that are not drafts", () => {
    const page = read("page.tsx");
    expect(page).toContain("resultsHref(modal.id)");
    expect(page).toMatch(/hasVoteBlock\(modal\.blocks\)[\s\S]{0,200}modal\.status !== "draft"|modal\.status !== "draft"[\s\S]{0,200}hasVoteBlock\(modal\.blocks\)/);
  });

  it("results route renders ResultsShell", () => {
    expect(read("[id]", "results", "page.tsx")).toContain("ResultsShell");
  });

  it("ResultsShell reuses ResultsTab and shows promo stats when there is no vote block", () => {
    const shell = read("editor", "ResultsShell.tsx");
    expect(shell).toContain("<ResultsTab");
    expect(shell).toContain("stats.shown");
    expect(shell).toContain('href={`/xeventsy/${encodeURIComponent(record.id)}`}');
  });

  it("editor header links to the results page for a saved giveaway", () => {
    expect(read("editor", "EditorShell.tsx")).toContain("resultsHref(record.id)");
  });
});
