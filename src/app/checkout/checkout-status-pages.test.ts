import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const failed = readFileSync("src/app/checkout/failed/page.tsx", "utf8");
const notFound = readFileSync("src/app/checkout/not-found.tsx", "utf8");
const loading = readFileSync("src/app/checkout/loading.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("checkout status pages", () => {
  it("failed: token colours only, the same three outcomes, one gradient primary", () => {
    expect(failed).not.toContain("amber-");
    expect(failed).not.toMatch(HEX);
    expect(failed).toContain("bg-error/10 text-error");
    // Copy is unchanged: only 402 promises the card was untouched (f020).
    expect(failed).toContain("You have not been charged. You can safely try again.");
    expect(failed).toContain("Do not pay again. Contact support with the reference below and we will sort it out.");
    expect(failed.match(/variant="flat"/g)).toHaveLength(1);
    // In the phone column a basis-0 flex-1 squashed the 54px buttons to ~24px.
    expect(failed).not.toContain('className="flex-1"');
    expect(failed.match(/className="w-full sm:flex-1"/g)).toHaveLength(3);
  });

  it("not-found: the same copy and Browse destinations CTA, in a card", () => {
    expect(notFound).toContain("We couldn&apos;t find that plan");
    expect(notFound).toContain('href="/destinations"');
    expect(notFound).toContain("rounded-[24px]");
    expect(notFound).not.toContain("bg-mist");
  });

  it("loading: shaped like the loaded checkout, and still under reduced motion", () => {
    expect(loading).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(loading).toContain("motion-safe:animate-pulse");
    expect(loading).toContain('aria-busy="true"');
    expect(loading).not.toMatch(HEX);
  });
});
