import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CONTENT_ASIDE,
  CONTENT_CARD,
  CONTENT_CARD_LINK,
  CONTENT_GUTTER,
  CONTENT_ICON_TILE,
  CONTENT_ROW_LINK,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "./contentClasses";
import { RETIRED_COLOR_CLASS } from "./retiredTokens";

describe("content page primitives (spec 8B)", () => {
  it("clears the floating navbar capsule by 24px", () => {
    expect(CONTENT_TOP).toBe("pt-[92px] lg:pt-[100px]");
    expect(CONTENT_GUTTER).toBe("px-5 md:px-8");
  });

  it("gives every standalone link a 44px target", () => {
    expect(CONTENT_ROW_LINK).toContain("min-h-11");
    expect(CONTENT_TEXT_LINK).toContain("min-h-11");
  });

  it("recognises the retired palette and nothing current", () => {
    for (const old of ["bg-mist", "text-midnight", "border-line", "bg-cloud", "text-cyan", "text-ink", "shadow-glow", "text-slate-600"]) {
      expect(old).toMatch(RETIRED_COLOR_CLASS);
    }
    for (const current of ["text-brandInk", "bg-surfaceBright", "border-outline/70", "shadow-brandCard", "to-brandTeal", "outline-none"]) {
      expect(current).not.toMatch(RETIRED_COLOR_CLASS);
    }
  });

  it("uses the phase-4 card language and only current tokens", () => {
    for (const classes of [CONTENT_CARD, CONTENT_CARD_LINK, CONTENT_ASIDE, CONTENT_ROW_LINK]) {
      expect(classes).toContain("rounded-[");
      expect(classes).toContain("border-outline/70");
    }
    expect(CONTENT_ASIDE).toContain("bg-surfaceBright");
    expect(CONTENT_ICON_TILE).toContain("hidden");
    expect(CONTENT_ICON_TILE).toContain("sm:grid");

    const source = readFileSync("src/app/components/contentClasses.ts", "utf8");
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("renders the FAQ as a native details accordion with 44px rows", () => {
    const faq = readFileSync("src/app/components/ContentFaq.tsx", "utf8");

    expect(faq).not.toContain('"use client"');
    expect(faq).toContain("<details");
    expect(faq).toContain("min-h-11");
    expect(faq).toContain("motion-safe:transition");
    expect(faq).not.toMatch(RETIRED_COLOR_CLASS);
  });
});
