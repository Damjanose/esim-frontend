import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(file: string) {
  return readFileSync(join(process.cwd(), "src/app/destinations", file), "utf8");
}

describe("live plans view pieces", () => {
  it("PlanFilterBar: one scrollable row of 44px chips, sort on the right", () => {
    const source = read("PlanFilterBar.tsx");

    expect(source).toContain("PLAN_FILTERS.map(");
    expect(source).toContain("PLAN_SORTS.map(");
    expect(source).toContain("aria-pressed={active}");
    expect(source).toContain("h-[46px] shrink-0 whitespace-nowrap rounded-full");
    // f209: the nowrap row can't widen its flex parent; f195: the scroller is positioned.
    expect(source).toContain('className="min-w-0 flex-1 [contain:inline-size]"');
    expect(source).toContain('className="relative flex gap-2 overflow-x-auto');
    // Sort: a 46px icon target on phones (invisible native select on top), labelled select from sm.
    expect(source).toContain("relative flex h-[46px] w-[46px] shrink-0");
    expect(source).toContain("absolute inset-0 h-full w-full cursor-pointer");
    expect(source).toContain("sm:static sm:h-11 sm:w-auto sm:opacity-100");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
  });

  it("PlansSidebar keeps the DestinationStats and PlansSupportBar content", () => {
    const source = read("PlansSidebar.tsx");

    for (const text of [
      '"plan available"',
      '"plans available"',
      '"Instant activation"',
      '"Start using in minutes"',
      '"Fast data"',
      '"Premium local networks"',
      '"Secure checkout"',
      '"Encrypted and trusted"',
      "All plans include premium network access and 24/7 customer support.",
      "Visit Help Center",
      'href="/support"',
    ]) {
      expect(source).toContain(text);
    }
    expect(source).toContain("min-h-11");
  });

  it("PlansStates: tokens only, a loading skeleton shaped like the loaded view", () => {
    const source = read("PlansStates.tsx");

    expect(source).toContain("Plans are temporarily unavailable");
    expect(source).toContain("No plans match this filter");
    expect(source).toContain("Show all plans");
    expect(source).toContain("No plans found for this destination");
    expect(source).toContain('href="/destinations"');
    expect(source).toContain("lg:grid-cols-[minmax(0,1fr)_280px]");
    expect(source).toContain('<div aria-hidden="true" className="lg:grid');
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("bg-white");
  });
});
