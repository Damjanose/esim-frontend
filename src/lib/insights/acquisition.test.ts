import { describe, expect, it } from "vitest";
import { acquisitionBarRows, answerLabel } from "./acquisition";

describe("answerLabel", () => {
  it("gives a plain name for each answer", () => {
    expect(answerLabel("search")).toBe("Search");
    expect(answerLabel("friend")).toBe("Friend or family");
    expect(answerLabel("app_store")).toBe("App store");
    expect(answerLabel("other")).toBe("Other");
  });
});

describe("acquisitionBarRows", () => {
  it("turns the answers into bar rows showing the count and the share", () => {
    const rows = acquisitionBarRows([
      { answer: "search", count: 6, share: 0.6 },
      { answer: "ad", count: 4, share: 0.4 }
    ]);
    expect(rows).toEqual([
      { label: "Search", value: 6, display: "6 (60.0%)" },
      { label: "Ad", value: 4, display: "4 (40.0%)" }
    ]);
  });

  it("shows a dash for a null share", () => {
    const rows = acquisitionBarRows([{ answer: "blog", count: 0, share: null }]);
    expect(rows[0].display).toBe("0 (—)");
  });
});
