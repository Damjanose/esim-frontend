import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Core Web Vitals performance contract", () => {
  it("serves the homepage hero through next/image with a lightweight WebP source", async () => {
    const pageSource = await readFile(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const heroWebpPath = join(process.cwd(), "public/images/mountain.webp");

    expect(pageSource).toContain('import Image from "next/image"');
    expect(pageSource).toContain('src="/images/mountain.webp"');
    expect(pageSource).toContain("priority");
    // `priority` alone preloads without a priority hint; LCP needs it high.
    expect(pageSource).toContain('fetchPriority="high"');
    expect(pageSource).toContain('sizes="100vw"');
    expect(existsSync(heroWebpPath)).toBe(true);
    expect(statSync(heroWebpPath).size).toBeLessThan(450 * 1024);
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

  it("reserves hero chip space while popular destinations load (CLS)", async () => {
    const source = await readFile(join(process.cwd(), "src/app/HeroDestinationChips.tsx"), "utf8");

    expect(source).toContain("CHIP_PLACEHOLDER_WIDTHS");
    expect(source).toContain("if (popular === null)");
  });

  it("serves the footer logo through next/image at its display size", async () => {
    const source = await readFile(join(process.cwd(), "src/app/SiteFooter.tsx"), "utf8");

    expect(source).toContain('import Image from "next/image"');
    expect(source).not.toMatch(/<img[^>]*app-logo\.png/);
  });
});
