import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(file: string) {
  return readFileSync(join(process.cwd(), "src/app/destinations", file), "utf8");
}

describe("PhotoTile", () => {
  it("is a fixed-size link with a brand-gradient placeholder, scrim, flag and caption", () => {
    const source = read("PhotoTile.tsx");

    expect(source).toContain('"use client"');
    // The gradient, the photo and the skeleton share one box: fixed width + aspect ratio.
    expect(source).toContain('trending: "w-[150px] aspect-[15/11] sm:w-[176px] lg:w-[208px]"');
    expect(source).toContain('rail: "w-[100px] aspect-[10/7] sm:w-[128px] lg:w-[152px]"');
    expect(source).toContain("bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal");
    expect(source).toContain("bg-gradient-to-t from-brandInk/85");
    // f147: country-specific flag alt text. Regional/global bundles without a flag get Globe2.
    expect(source).toContain("alt={`${country} flag`}");
    expect(source).toContain("<Globe2");
    // The photo is decorative (the name is text) and sized to the tile, not the 1920px original.
    expect(source).toContain('alt=""');
    expect(source).toContain('trending: "(min-width: 1024px) 208px, (min-width: 640px) 176px, 150px"');
    expect(source).toContain('rail: "(min-width: 1024px) 152px, (min-width: 640px) 128px, 100px"');
    expect(source).toContain("unoptimized={!isOptimizableImageUrl(photoUrl)}");
    // A broken photo falls back to the gradient.
    expect(source).toContain("onError={() => setFailedUrl(photoUrl)}");
    // Token colors only (#0E86C0 is the documented gradient stop).
    expect(source).not.toMatch(/#(?!0E86C0)[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("fetch(");
  });

  it("requests its photo only when the tile nears the viewport, through the shared cache", () => {
    const source = read("useLazyCountryImage.ts");

    expect(source).toContain('export const TILE_IMAGE_ROOT_MARGIN = "200px";');
    expect(source).toContain("new IntersectionObserver(");
    expect(source).toContain("{ rootMargin: TILE_IMAGE_ROOT_MARGIN }");
    expect(source).toContain("observer.disconnect();");
    expect(source).toContain("peekCountryImage(");
    expect(source).toContain("loadCountryImage(");
    expect(source).not.toContain("fetch(");
  });
});
