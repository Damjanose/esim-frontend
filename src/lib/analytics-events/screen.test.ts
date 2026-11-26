import { readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { destinationFromPath, SCREEN_TEMPLATES, screenTemplate } from "./screen";

const APP_DIR = join(process.cwd(), "src", "app");

/** Public page folders as route templates, lower case, e.g. `/esim/[slug]`. Admin (`x*`) and API folders are skipped. */
function publicPageRoutes(dir = APP_DIR, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      publicPageRoutes(full, found);
      continue;
    }
    if (entry !== "page.tsx") continue;
    const rel = relative(APP_DIR, dir).split(sep).filter(Boolean);
    if (rel.some((segment) => segment.startsWith("x") || segment === "bff" || segment === "api")) continue;
    found.push("/" + rel.map((segment) => segment.toLowerCase()).join("/").replace(/\/$/, ""));
  }
  return found;
}

describe("screenTemplate", () => {
  it.each([
    ["/esim/usa", "/esim/[slug]"],
    ["/account/123", "/account/[orderid]"],
    ["/compare/x", "/compare/[slug]"],
    ["/orders/ABC12", "/orders/[code]"],
    ["/", "/"],
    ["/destinations/", "/destinations"]
  ])("maps %s to %s", (pathname, template) => {
    expect(screenTemplate(pathname)).toBe(template);
  });

  it("returns null for admin screens so they are never recorded", () => {
    expect(screenTemplate("/xinsightsy")).toBeNull();
    expect(screenTemplate("/xloginy")).toBeNull();
  });

  it("maps unknown paths to /other", () => {
    expect(screenTemplate("/nope/not-a-page/at-all")).toBe("/other");
  });

  it("maps every public page.tsx route in src/app, so a new page fails this test until it is listed", () => {
    const routes = publicPageRoutes();
    expect(routes.length).toBeGreaterThan(20);
    for (const route of routes) {
      expect(SCREEN_TEMPLATES, `missing template for ${route}`).toContain(route);
    }
  });
});

describe("destinationFromPath", () => {
  it("converts the public slug to the backend country code", () => {
    expect(destinationFromPath("/esim/usa")).toBe("united-states");
    expect(destinationFromPath("/esim/europe")).toBe("europe");
  });

  it("returns null outside destination pages", () => {
    expect(destinationFromPath("/esim/id/abc")).toBeNull();
    expect(destinationFromPath("/destinations")).toBeNull();
  });
});

it("finds the app directory the test reads", () => {
  expect(existsSync(APP_DIR)).toBe(true);
});
