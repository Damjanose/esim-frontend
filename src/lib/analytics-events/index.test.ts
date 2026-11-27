import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("web tracker entry point", () => {
  const source = readFileSync("src/lib/analytics-events/index.ts", "utf8");

  it("keeps the frozen public API", () => {
    expect(source).toContain("export function trackWebEvent(");
    expect(source).toContain("export type { EventInput };");
  });

  it("checks analytics consent before anything is queued", () => {
    expect(source).toContain("readConsentFromDocument");
    expect(source).toContain("consent?.analytics");
  });

  it("never records on admin pages", () => {
    expect(source).toMatch(/\/\^\\\/x\[a-z\]\/i\.test\(window\.location\.pathname\)/);
  });

  it("flushes every 30 seconds and when the page is hidden, to /bff/events", () => {
    expect(source).toContain("FLUSH_INTERVAL_MS");
    expect(source).toContain('"/bff/events"');
    expect(source).toContain("pagehide");
    expect(source).toContain("visibilitychange");
  });

  it("reads campaign and referrer only from the first landing of a session", () => {
    expect(source).toContain("utm_source");
    expect(source).toContain("document.referrer");
  });
});
