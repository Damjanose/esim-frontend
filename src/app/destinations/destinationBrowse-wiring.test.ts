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

  it("keeps wizard auto-open disabled by default", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain("autoOpenWizard = false");
    expect(source).toContain("useState(autoOpenWizard)");
  });

  it("keeps the welcome intro and auto-open transition available only for explicit opt-in flows", () => {
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

  it("the homepage keeps the wizard closed until the visitor asks for help", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).toContain("<DestinationBrowse urlFilters={{}}");
    expect(source).not.toContain("<DestinationBrowse autoOpenWizard");
  });

  it("the wizard closes from Escape as well as its close button and backdrop", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/HelpMeChooseWizard.tsx"),
      "utf8",
    );

    expect(source).toContain('document.addEventListener("keydown", handleKeyDown)');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
  });

  it("carries the wizard's trip-length/data filters alongside a picked country, instead of dropping them", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain("destinationBrowseHref");
    expect(source).toContain('if (result.kind === "country") {');
  });

  it("the destinations page forwards the wizard's filter query params to the per-country plans list", () => {
    const source = readFileSync(join(process.cwd(), "src/app/destinations/page.tsx"), "utf8");

    expect(source).toContain("generateMetadata");
    expect(source).toContain("indexable: !hasSelectedCountry");
    expect(source).toContain("permanentRedirect");
    expect(source).toContain(
      "<DestinationPlans countryCode={countryCode} searchFilters={wizardFilterParams} />",
    );
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
