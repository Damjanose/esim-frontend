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

  it("opens a search dialog instead of an inline dropdown at every size", () => {
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");
    const dialogSource = readFileSync(join(process.cwd(), "src/app/HeroSearchDialog.tsx"), "utf8");

    // The hero field is only a trigger; results never render inside the hero.
    expect(componentSource).toContain('aria-haspopup="dialog"');
    expect(componentSource).toContain("onClick={openDialog}");
    expect(componentSource).not.toContain("<input");
    expect(componentSource).not.toContain("Popular destinations");
    // Dialog mounts synchronously so focusing its input stays inside the tap (iOS keyboard).
    expect(componentSource).toContain("flushSync(() => setIsDialogOpen(true))");
    // Portaled out of the hero's isolate stacking context, above navbar + dock:
    // full screen on phones, a centered panel over a dimmed backdrop from sm up.
    expect(dialogSource).toContain("createPortal(");
    expect(dialogSource).toContain("fixed inset-0 z-[1000] flex flex-col bg-surface");
    expect(dialogSource).toContain("sm:bg-brandInk/60");
    expect(dialogSource).toContain("sm:max-w-[680px]");
    expect(dialogSource).toContain('aria-modal="true"');
    expect(dialogSource).toContain('document.body.style.overflow = "hidden"');
    // Keyboard: arrows move the highlighted match, Tab is trapped, Esc closes.
    expect(dialogSource).toContain('event.key === "ArrowDown"');
    expect(dialogSource).toContain('event.key !== "Tab"');
    // 16px input so iOS Safari doesn't zoom on focus.
    expect(dialogSource).toContain("text-base font-semibold text-onSurface outline-none");
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

  it("renders the dark photo-card hero with search, tune button and a plain perk line", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const hero = pageSource.slice(
      pageSource.indexOf("function Hero()"),
      pageSource.indexOf("function HowItWorks()"),
    );

    // One-colour, brand-led H1 (branded search + entity: the H1 names the
    // brand and what it sells), no eyebrow pill, no fake preview card, no chips.
    expect(hero).toContain("eSIM2you: travel eSIMs for 200+ destinations");
    expect(hero).toContain("Your phone works the minute you land.");
    expect(hero).not.toContain("text-brandTeal");
    expect(hero).not.toContain("eSIM preview");
    expect(pageSource).not.toContain("HeroDestinationChips");
    // Photo card: full-bleed below lg, rounded from lg; no on-photo credit line.
    expect(hero).toContain("rounded-b-[28px] bg-brandInk text-white lg:rounded-[32px]");
    expect(hero).not.toContain("Photo: NASA");
    // Perks are a plain text line, not icon tiles.
    expect(pageSource).toContain("const heroPerks = [");
    expect(hero).toContain("<li key={perk}>{perk}</li>");
    // Search + tune.
    expect(hero).toContain("<HeroPackageSearch />");
    expect(hero).toContain("<HeroTuneButton />");
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
    // Same 56px height as the search field next to it; dark glass on the hero.
    expect(source).toContain("h-14 w-14");
    expect(source).toContain("bg-white/10");
  });
});
