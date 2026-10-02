import { describe, expect, it } from "vitest";
import { NAV_CLEARANCE_PX, initialNavTone, isNavLinkActive, navToneFor } from "./navTone";

describe("navToneFor", () => {
  it("is dark while the dark hero card is still under the capsule", () => {
    expect(navToneFor(600)).toBe("dark");
    expect(navToneFor(NAV_CLEARANCE_PX + 1)).toBe("dark");
  });

  it("turns light once the hero has scrolled past, or when there is no hero", () => {
    expect(navToneFor(NAV_CLEARANCE_PX)).toBe("light");
    expect(navToneFor(-200)).toBe("light");
    expect(navToneFor(null)).toBe("light");
  });
});

describe("initialNavTone", () => {
  it("opens dark only on the homepage", () => {
    expect(initialNavTone("/")).toBe("dark");
    expect(initialNavTone("/destinations")).toBe("light");
    expect(initialNavTone(null)).toBe("light");
  });
});

describe("isNavLinkActive", () => {
  it("matches the link's route and its sub-pages", () => {
    expect(isNavLinkActive("/travel", "/travel")).toBe(true);
    expect(isNavLinkActive("/travel/japan-esim", "/travel")).toBe(true);
    expect(isNavLinkActive("/travelers", "/travel")).toBe(false);
    expect(isNavLinkActive("/", "/support")).toBe(false);
    expect(isNavLinkActive(null, "/support")).toBe(false);
  });

  it("marks no navbar link on country plan pages", () => {
    expect(isNavLinkActive("/esim/italy", "/compare")).toBe(false);
    expect(isNavLinkActive("/pkg/123", "/travel")).toBe(false);
  });
});
