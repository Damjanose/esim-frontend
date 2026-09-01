import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("DestinationBrowse error handling and wizard auto-open wiring", () => {
  it("shows a retry affordance instead of silently rendering empty results on a failed fetch", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain("loadError");
    expect(source).toContain("Try again");
    expect(source).toContain("handleRetry");
  });

  it("supports opening the wizard automatically via an autoOpenWizard prop, defaulting to off", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain("autoOpenWizard = false");
    expect(source).toContain("useState(autoOpenWizard)");
  });

  it("gates the auto-opened wizard on the welcome intro's minimum delay AND the data fetch having settled, so it never opens with an empty country list", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain("import { WizardWelcomeIntro }");
    expect(source).toContain("WELCOME_MIN_DELAY_MS");
    expect(source).toContain("if (!showWelcome || !welcomeMinDelayDone || loading) return;");
    expect(source).toContain("if (!loadError) setWizardOpen(true);");
    // The manual button is disabled while data is still loading too, closing
    // the same race for a click that lands before the fetch has settled.
    expect(source).toContain("disabled={loading}");
  });

  it("/destinations does not opt into auto-opening the wizard, keeping button-only behavior", () => {
    const source = readFileSync(join(process.cwd(), "src/app/destinations/page.tsx"), "utf8");

    expect(source).not.toContain("autoOpenWizard");
  });

  it("the homepage opts into auto-opening the wizard", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).toContain("<DestinationBrowse autoOpenWizard");
  });
});

describe("HeroDestinationChips error handling", () => {
  it("shows a retry affordance instead of silently disappearing on a failed fetch", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/HeroDestinationChips.tsx"),
      "utf8",
    );

    expect(source).toContain("loadError");
    expect(source).toContain("try again");
    expect(source).toContain("handleRetry");
  });
});
