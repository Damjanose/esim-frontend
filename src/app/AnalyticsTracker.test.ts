import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AnalyticsTracker", () => {
  const source = readFileSync("src/app/AnalyticsTracker.tsx", "utf8");

  it("is a client component that reads the pathname and consent", () => {
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain("usePathname");
    expect(source).toContain("useConsent()");
  });

  it("sends nothing on admin pages and sends screen views through trackWebEvent", () => {
    expect(source).toContain('startsWith("/x")');
    expect(source).toContain('type: "screen_view"');
    expect(source).toContain("trackWebEvent(");
  });

  it("is mounted in the root layout next to GoogleTag", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toContain('import { AnalyticsTracker } from "./AnalyticsTracker";');
    expect(layout).toContain("<AnalyticsTracker />");
  });

  it("does nothing without consent and never sends the same path twice", () => {
    expect(source).toContain("if (!analyticsAllowed) return;");
    expect(source).toContain("lastSent");
    expect(source).toContain("lastSent.current === pathname");
  });

  it("clears stored ids once consent is withdrawn", () => {
    expect(source).toContain("syncAnalyticsConsent()");
  });
});
