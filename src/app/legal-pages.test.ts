import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { landingContent } from "@/content/landing";

describe("legal pages and hydration-safe shell", () => {
  it("publishes footer links for support, contact, policy, and terms", () => {
    expect(landingContent.supportLinks).toEqual([
      { label: "Support", href: "#faq" },
      { label: "Contact", href: "mailto:esim@uplisoft.com" },
      { label: "Policy", href: "/policy" },
      { label: "Terms", href: "/terms" }
    ]);
  });

  it("has public policy and terms routes", () => {
    expect(existsSync("src/app/policy/page.tsx")).toBe(true);
    expect(existsSync("src/app/terms/page.tsx")).toBe(true);
  });

  it("suppresses root shell hydration warnings from browser-injected attributes", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");

    expect(layout).toContain("<html lang=\"en\" suppressHydrationWarning>");
    expect(layout).toContain("<body suppressHydrationWarning>{children}</body>");
  });
});
