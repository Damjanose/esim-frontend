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
