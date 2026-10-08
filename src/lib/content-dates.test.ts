import { describe, expect, it } from "vitest";
import { contentUpdatedAt } from "./content-dates";

describe("content dates", () => {
  it("uses per-page dates instead of one site-wide timestamp", () => {
    expect(contentUpdatedAt("/").toISOString()).toBe("2026-10-02T00:00:00.000Z");
    expect(contentUpdatedAt("/esim/croatia").toISOString()).toBe("2026-09-27T00:00:00.000Z");
    expect(contentUpdatedAt("/travel/how-to-install-esim").toISOString()).toBe("2026-09-12T00:00:00.000Z");
  });

  it("never dates content in the future", () => {
    for (const path of ["/", "/destinations", "/trip-plan", "/support", "/esim/usa", "/travel", "/compare/x"]) {
      expect(contentUpdatedAt(path).getTime()).toBeLessThanOrEqual(Date.now());
    }
  });
});
