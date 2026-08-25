import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { landingContent } from "@/content/landing";

describe("legal pages and hydration-safe shell", () => {
  it("publishes footer links for support, contact, policy, and terms", () => {
    expect(landingContent.supportLinks).toEqual([
      { label: "Support", href: "#faq" },
      { label: "Contact", href: "mailto:esim2you@uplisoft.com" },
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
    expect(layout).toMatch(/<body[\s\S]*?suppressHydrationWarning[\s\S]*?>\s*{children}\s*<\/body>/);
  });

  it("keeps the browser canvas aligned with the light app background during overscroll", () => {
    const globalCss = readFileSync("src/app/globals.css", "utf8");

    expect(globalCss).toContain("background: #ffffff;");
    expect(globalCss).not.toContain("background: #020916;");
  });

  it("uses the app logo asset for legal page branding instead of a generic icon", () => {
    const legalPage = readFileSync("src/app/LegalDocumentPage.tsx", "utf8");

    expect(legalPage).toContain('src="/app-logo.png"');
    expect(legalPage).not.toContain("Globe2");
  });
});
