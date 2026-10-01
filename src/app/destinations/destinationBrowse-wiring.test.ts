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

  it("opens its single wizard on an outside request (hero tune button), only once data has loaded", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain('import { onPlanWizardRequest } from "./planWizardOpener";');
    expect(source).toContain("useEffect(() => onPlanWizardRequest(() => setWizardRequested(true)), []);");
    // Held until the fetch settles, like the button's disabled={loading}.
    expect(source).toContain("if (!wizardRequested || loading) return;");
    // There is exactly one wizard per page; outside callers never mount another.
    expect(source.match(/<HelpMeChooseWizard\b/g)).toHaveLength(1);
  });

  it("renders Trending and every rail as lazy PhotoTile carousels, with a tile-sized skeleton", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );
    const skeleton = readFileSync(
      join(process.cwd(), "src/app/destinations/BrowseSkeleton.tsx"),
      "utf8",
    );

    // Trending + the RAILS map: every scroller goes through TileCarousel (f195/f209 guards live there).
    expect(source.match(/<TileCarousel\b/g)).toHaveLength(2);
    expect(source).not.toContain("overflow-x-auto");
    expect(source).toContain('<li className="shrink-0 snap-start" key={pkg.id}>');
    expect(source).toContain("detail={`${pkg.dataLabel} · ${pkg.durationLabel} · from ${pkg.price}`}");
    expect(source).toContain('size="trending"');
    expect(source).toContain("detail={`from ${pkg.price}`}");
    expect(source).toContain('size="rail"');
    // Trending keeps its sort (re-sorting scrolls back to the first tile) and its count line.
    expect(source).toContain("resetKey={trendingSort}");
    expect(source).toContain('<option value="recommended">Recommended</option>');
    expect(source).toContain("selected by the team");
    for (const label of [
      "Popular destinations",
      "Featured plans",
      "Unlimited data",
      "Long stay (30+ days)",
      "Regional & global bundles",
    ]) {
      expect(source).toContain(`label: "${label}"`);
    }
    // Loading: placeholders in the same carousels and tile boxes (no CLS), hidden from AT.
    expect(source).toContain("<BrowseSkeleton />");
    expect(skeleton).toContain("PHOTO_TILE_BOX.trending");
    expect(skeleton).toContain("PHOTO_TILE_BOX.rail");
    expect(skeleton).toContain('<div aria-hidden="true" inert>');
  });

  it("lists All destinations as CountryRow cards (1/2/3 columns) and keeps search + Show all/Show less", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain('import { CountryRow } from "./CountryRow";');
    expect(source).toContain('<ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">');
    expect(source).toContain("fromPrice={country.fromPrice}");
    expect(source).toContain('placeholder="Search all destinations..."');
    expect(source).toContain("DESTINATIONS_COLLAPSED_COUNT = 20");
    expect(source).toContain("Show less");
    expect(source).toContain("Show all {filteredCountries.length} destinations");
    // One gradient primary (Help me choose); Show all and Try again are flat.
    expect(source.match(/variant="flat"/g)).toHaveLength(2);
    expect(source).toContain('import { Button } from "../components/Button";');
    // Tokens only: no retired mist panels or raw white.
    expect(source).not.toContain("bg-mist");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-white");
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
