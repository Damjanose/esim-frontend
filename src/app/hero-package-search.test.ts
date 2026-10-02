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

  it("keeps the search results dropdown stacked inside the hero section", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");

    // The hero keeps its own stacking context (isolate z-20), so the search
    // pill and its in-flow results dropdown (z-[100]/z-[70]) stay above the photo
    // and never escape over the navbar or the sections below.
    expect(pageSource).toContain('className="relative isolate z-20 bg-surface text-onSurface"');
    // Only the photo layer clips; the card itself must not, or the in-flow
    // dropdown would be cut off.
    expect(pageSource).toContain('className="absolute inset-0 overflow-hidden rounded-[inherit]"');
    expect(componentSource).toContain('className="relative z-[100] w-full max-w-[620px]"');
  });

  it("opens a full-screen search on phones instead of the inline dropdown", () => {
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");
    const sheetSource = readFileSync(join(process.cwd(), "src/app/HeroMobileSearch.tsx"), "utf8");

    // Below sm the field is a button that opens the sheet; the input and the
    // inline dropdown only exist from sm up, so nothing reflows the hero.
    expect(componentSource).toContain('aria-haspopup="dialog"');
    expect(componentSource).toContain("onClick={openMobileSearch}");
    expect(componentSource).toContain("text-left sm:hidden");
    expect(componentSource).toContain("hidden min-h-[60px] min-w-0 items-center gap-3 rounded-[15px] bg-outline/10 px-4 sm:flex");
    expect(componentSource).toContain("mt-3 hidden overflow-hidden rounded-[20px] border border-outline bg-surface shadow-brandCard sm:block");
    // Sheet mounts synchronously so focusing its input stays inside the tap (iOS keyboard).
    expect(componentSource).toContain("flushSync(() => setIsMobileOpen(true))");
    // Portaled out of the hero's isolate stacking context, above navbar + dock.
    expect(sheetSource).toContain("createPortal(");
    expect(sheetSource).toContain('className="fixed inset-0 z-[1000] flex flex-col bg-surface text-onSurface"');
    expect(sheetSource).toContain('aria-modal="true"');
    expect(sheetSource).toContain('document.body.style.overflow = "hidden"');
    // 16px input so iOS Safari doesn't zoom on focus.
    expect(sheetSource).toContain("text-base font-semibold text-onSurface outline-none");
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

  it("renders the dark photo-card hero with search, tune button, chips and trust signals", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const hero = pageSource.slice(
      pageSource.indexOf("function Hero()"),
      pageSource.indexOf("function Benefits()"),
    );

    // Eyebrow pill + H1 with the accent on its second line.
    expect(hero).toContain("200+ destinations · Instant activation");
    expect(hero).toContain("Land anywhere.");
    expect(hero).toContain('<span className="text-brandTeal">Already connected.</span>');
    // Photo card: full-bleed below lg, rounded from lg; NASA credit line.
    expect(hero).toContain("rounded-b-[28px] bg-brandInk text-white lg:rounded-[32px]");
    expect(hero).toContain("Photo: NASA");
    // Trust signals: the eSIM preview card (lg+) and the perk strip.
    expect(hero).toContain("Install in minutes · 24/7 support");
    expect(pageSource).toContain("const heroPerks = [");
    // Search + tune + chips.
    expect(hero).toContain("<HeroPackageSearch />");
    expect(hero).toContain("<HeroTuneButton />");
    expect(hero).toContain("<HeroDestinationChips />");
    expect(pageSource).toContain('import { HeroTuneButton } from "./HeroTuneButton";');
    // The wizard is only ever DestinationBrowse's.
    expect(pageSource).not.toContain("HelpMeChooseWizard");
  });
});

describe("HeroTuneButton", () => {
  it("asks DestinationBrowse's wizard to open instead of mounting its own", () => {
    const source = readFileSync(join(process.cwd(), "src/app/HeroTuneButton.tsx"), "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("SlidersHorizontal");
    expect(source).toContain('aria-label="Help me choose a plan"');
    expect(source).toContain('import { requestPlanWizard } from "./destinations/planWizardOpener";');
    // Wrapped in an arrow, so the click event is never passed in as the dispatch target.
    expect(source).toContain("onClick={() => requestPlanWizard()}");
    expect(source).not.toContain("HelpMeChooseWizard");
    // Matches the 78px search pill next to it.
    expect(source).toContain("h-[78px]");
  });
});
