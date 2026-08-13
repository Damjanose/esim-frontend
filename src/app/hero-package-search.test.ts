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

    expect(pageSource).toContain('className="relative z-20"');
    expect(pageSource).toContain('className="relative z-0 mx-auto w-full max-w-[440px]"');
    expect(componentSource).toContain("z-50 overflow-hidden");
  });
});
