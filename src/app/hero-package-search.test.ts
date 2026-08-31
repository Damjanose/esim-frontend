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

  it("keeps the search results dropdown layered above the hero's background photo", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");

    // The hero photo sits behind the content at -z-20/-z-10; the search pill and its
    // results dropdown (z-[100]/z-[70]) must stack above both the photo and the section.
    expect(pageSource).toContain('className="relative isolate z-20 overflow-hidden bg-brandInk text-white"');
    expect(pageSource).toContain('src="/images/mountain.webp"');
    expect(componentSource).toContain('className="relative z-[100] w-full max-w-[620px]"');
  });

  it("no longer renders the deleted static hero graphic or non-live plan cards", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(pageSource).not.toContain("function HeroVisual");
    expect(pageSource).not.toContain("function DestinationBubble");
    expect(pageSource).not.toContain("function FeatureCard");
    expect(pageSource).not.toContain("function Plans");
    expect(pageSource).toContain("import { DestinationBrowse }");
    expect(pageSource).toContain("<DestinationBrowse");
  });
});
