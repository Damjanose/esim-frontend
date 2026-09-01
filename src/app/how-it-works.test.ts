import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HowItWorks section", () => {
  it("renders the how-it-works section as a device-mockup phone trio, not the old icon-card list", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).toContain("function HowItWorks()");
    expect(source).toContain("<ChoosePlanScreen");
    expect(source).toContain("<ScanInstallScreen");
    expect(source).toContain("<ConnectedScreen");
  });

  it("removes the 'Where Will You Go Next?' coverage column and its flag mosaic entirely", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).not.toContain("Where Will You Go Next?");
    expect(source).not.toContain("JourneyAndCoverage");
    expect(source).not.toContain("CoverageFlagMosaic");
  });

  it("the scan & install screen links a real, static QR code to esim.uplisoft.com instead of a fake CSS pattern", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).toContain("/images/qr-esim-uplisoft.svg");
  });
});
