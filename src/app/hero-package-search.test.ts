import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HeroPackageSearch", () => {
  it("loads package options from the package service instead of static landing destinations", () => {
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");
    const serviceSource = readFileSync(join(process.cwd(), "src/services/packages.ts"), "utf8");
    const routeSource = readFileSync(join(process.cwd(), "src/app/bff/packages/route.ts"), "utf8");
    // The backend base URL now lives in a single module shared by every proxy route.
    const backendSource = readFileSync(join(process.cwd(), "src/lib/backend.ts"), "utf8");

    expect(componentSource).toContain("fetchPackageOptions");
    expect(componentSource).not.toContain("landingContent.destinations");
    expect(serviceSource).toContain('fetch("/bff/packages"');
    expect(routeSource).toContain("backendFetch");
    expect(routeSource).toContain("/packages");
    expect(backendSource).toContain('"https://esim.uplisoft.com/api"');
    expect(backendSource).not.toContain('"http://localhost:4000/api"');
  });

  it("keeps the mobile package results layered above the hero device mockup", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");

    // Left content column (holds HeroPackageSearch) vs. the hero device mockup image (z-10) —
    // the column must stack above the mockup, and the search results dropdown (z-[100]/z-[70])
    // must stack above the column itself.
    expect(pageSource).toContain('className="relative z-20 mx-auto w-full max-w-[610px] text-center lg:mx-0 lg:text-left"');
    expect(pageSource).toContain('src="/images/hero-map-and-phone.webp"');
    expect(componentSource).toContain('className="relative z-[100] mt-8 w-full max-w-[620px]"');
  });
});
