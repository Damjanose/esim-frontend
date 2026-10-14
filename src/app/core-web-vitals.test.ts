import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Core Web Vitals performance contract", () => {
  it("serves the homepage hero as an art-directed <picture> of lightweight WebP crops", async () => {
    const pageSource = await readFile(join(process.cwd(), "src/app/page.tsx"), "utf8");

    // getImageProps + <picture>: the browser downloads only the crop for its
    // breakpoint (tall below lg, wide from lg), still through the image optimizer.
    expect(pageSource).toContain('import { getImageProps } from "next/image"');
    expect(pageSource).toContain("<picture>");
    expect(pageSource).toContain('<source media="(min-width: 1024px)"');
    expect(pageSource).toContain('src: "/images/hero-earth-wide.webp"');
    expect(pageSource).toContain('src: "/images/hero-earth-tall.webp"');
    // No `priority` (it would preload the tall crop on desktop too); the LCP
    // <img> is eager with a high fetch priority instead.
    expect(pageSource).toContain('fetchPriority: "high"');
    expect(pageSource).toContain('loading: "eager"');
    expect(pageSource).toContain('sizes="(min-width: 1440px) 1400px, 1280px"');
    expect(pageSource).toContain("quality: 90,");
    expect(pageSource).toContain("quality: 80,");

    // High-quality masters: visitors only ever get the optimizer's per-width
    // re-encodes, never these files, so the cap is on the source, not the wire.
    for (const file of ["hero-earth-wide.webp", "hero-earth-tall.webp"]) {
      const path = join(process.cwd(), "public/images", file);
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeLessThan(1500 * 1024);
    }
  });

  it("does not mark unversioned logo files as immutable year-long cache", async () => {
    const configSource = await readFile(join(process.cwd(), "next.config.mjs"), "utf8");

    expect(configSource).toContain('source: "/:path(logo-icon.png|app-logo.png)"');
    expect(configSource).toContain("public, max-age=3600, must-revalidate");
    expect(configSource).not.toMatch(
      /source: "\/:path\(logo-icon\.png\|app-logo\.png\)"[\s\S]*?immutable/,
    );
  });

  it("allows the remote image hosts used by public marketing images", async () => {
    const configSource = await readFile(join(process.cwd(), "next.config.mjs"), "utf8");

    expect(configSource).toContain('hostname: "images.unsplash.com"');
    // Wildcarded rather than a single literal host: Wikimedia serves country
    // images from more than one subdomain (upload.wikimedia.org for
    // originals, thumb.wikimedia.org for thumbnails, ...) depending on what
    // its imageinfo API returns for a given image.
    expect(configSource).toContain('hostname: "*.wikimedia.org"');
  });


  it("keeps the homepage's first load free of fonts and Lottie it doesn't paint", async () => {
    const layout = await readFile(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const browse = await readFile(join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"), "utf8");

    // Geist (font-mono) is only used in the wizard and admin pages; preloading it
    // at high priority competed with the LCP hero image on every page.
    expect(layout).toMatch(/Geist\(\{[^}]*preload: false/);
    // lottie-web (~76 KB gzip) only plays once the wizard intro opens.
    expect(browse).not.toContain('import { WizardWelcomeIntro } from "./WizardWelcomeIntro"');
    expect(browse).toContain('import("./WizardWelcomeIntro")');
  });

  it("serves Airalo flag images through next/image (no third-party cookie, sized to display)", async () => {
    const config = await readFile(join(process.cwd(), "next.config.mjs"), "utf8");
    expect(config).toContain('hostname: "cdn-revamp.airalo.com"');

    for (const file of [
      "src/app/destinations/CountryRow.tsx",
      "src/app/destinations/DestinationPlans.tsx",
      "src/app/EsimDestinationPage.tsx",
      "src/app/components/CollapsedCountryBar.tsx",
      "src/app/components/EsimFlag.tsx",
      "src/app/HeroSearchDialog.tsx",
      "src/app/HeroPackageSearch.tsx",
      "src/app/destinations/PhotoTile.tsx",
      "src/app/destinations/HelpMeChooseWizard.tsx",
      "src/app/checkout/OrderSummary.tsx",
      "src/app/pkg/[id]/page.tsx"
    ]) {
      const source = await readFile(join(process.cwd(), file), "utf8");
      expect(source, file).toContain("<FlagImage");
      expect(source, file).not.toMatch(/<img[^>]*src=\{[^}]*flagUri/);
    }
  });

  it("serves the footer logo through next/image at its display size", async () => {
    const source = await readFile(join(process.cwd(), "src/app/SiteFooter.tsx"), "utf8");

    expect(source).toContain('import Image from "next/image"');
    expect(source).not.toMatch(/<img[^>]*app-logo\.png/);
  });

  it("keeps the destination plan table's sr-only cells inside its scroller", async () => {
    const source = await readFile(join(process.cwd(), "src/app/EsimDestinationPage.tsx"), "utf8");

    // An unpositioned overflow-x-auto wrapper lets absolute sr-only children escape and
    // widen the mobile layout viewport (375px phones rendered /esim/* at 479px).
    expect(source).toContain('className="relative mt-8 overflow-x-auto');
  });
});
