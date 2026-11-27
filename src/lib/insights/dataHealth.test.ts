import { describe, expect, it } from "vitest";
import { platformHealth } from "./dataHealth";

const NOW = Date.parse("2026-11-27T12:00:00Z");

describe("platformHealth", () => {
  it("is a neutral wait, not an error, when a platform has never sent an event", () => {
    expect(platformHealth(null, NOW, true)).toEqual({ tone: "waiting", label: "No events yet" });
  });

  it("says collection is off when it is", () => {
    expect(platformHealth(null, NOW, false)).toEqual({ tone: "waiting", label: "Collection is off" });
  });

  it("shows the latest event time when it is recent", () => {
    const health = platformHealth("2026-11-27T11:00:00Z", NOW, true);
    expect(health.tone).toBe("ok");
  });

  it("flags a platform whose events stopped for more than a day", () => {
    const health = platformHealth("2026-11-26T10:00:00Z", NOW, true);
    expect(health.tone).toBe("stale");
    expect(health.label).toMatch(/^Nothing for 24 hours \(last /);
  });
});
