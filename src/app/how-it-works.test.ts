import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HowItWorks section", () => {
  it("renders the how-it-works section as one next/image of the real app screens, with descriptive alt text", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).toContain("function HowItWorks()");
    expect(source).toContain('import Image from "next/image"');
    expect(source).toContain("/images/how-it-works-app-screens.png");
    expect(source).toContain(
      'alt="eSIM2you app screens: destination list, United Kingdom plans and billing details"',
    );
    // The CSS phone mockups were replaced by the screenshot; no dead helpers left behind.
    expect(source).not.toContain("PhoneFrame");
    expect(source).not.toContain("ScanInstallScreen");
    expect(source).not.toContain("ConnectedScreen");
  });

  it("removes the 'Where Will You Go Next?' coverage column and its flag mosaic entirely", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).not.toContain("Where Will You Go Next?");
    expect(source).not.toContain("JourneyAndCoverage");
    expect(source).not.toContain("CoverageFlagMosaic");
  });

  it("does not fake a QR code or phone UI with CSS: the section uses the real screenshot", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).not.toContain("qr-esim-uplisoft");
    expect(source).not.toContain("PhoneStatusBar");
  });
});
