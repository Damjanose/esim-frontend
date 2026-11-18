import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { privateRoutePrefixes } from "@/lib/seo";

describe("hidden event modals admin list page", () => {
  it("publishes a hidden /xeventsy route with noindex metadata", () => {
    expect(existsSync("src/app/xeventsy/layout.tsx")).toBe(true);
    expect(existsSync("src/app/xeventsy/page.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xeventsy/layout.tsx", "utf8");
    expect(layoutSource).toContain('path: "/xeventsy"');
    expect(layoutSource).toContain("indexable: false");
  });

  it("keeps the route out of the public sitemap source", () => {
    expect(privateRoutePrefixes).toContain("/xeventsy");
  });

  it("is a client page that uses the shared admin session and the xeventsy api helper", () => {
    const pageSource = readFileSync("src/app/xeventsy/page.tsx", "utf8");

    expect(pageSource).toContain('"use client"');
    expect(pageSource).toContain("AdminNav");
    expect(pageSource).toContain("AdminLoginCard");
    expect(pageSource).toContain("useAdminSession");
    expect(pageSource).toContain('from "./api"');
    expect(pageSource).toContain("adminFetch");
    expect(pageSource).toContain("handleUnauthorized");
  });

  it("loads the list and routes every action through the event-modals BFF", () => {
    const pageSource = readFileSync("src/app/xeventsy/page.tsx", "utf8");

    expect(pageSource).toContain('adminFetch<{ eventModals: EventModalRecord[] }>(');
    expect(pageSource).toContain('"publish"');
    expect(pageSource).toContain('"duplicate"');
    expect(pageSource).toContain('"archive"');
    expect(pageSource).toContain("method: \"POST\"");
  });

  it("links to the new and edit routes and shows a giveaway badge", () => {
    const pageSource = readFileSync("src/app/xeventsy/page.tsx", "utf8");

    expect(pageSource).toContain("New match giveaway");
    expect(pageSource).toContain("New promo");
    expect(pageSource).toContain('href="/xeventsy/new"');
    expect(pageSource).toContain("href={`/xeventsy/${");
    expect(pageSource).toContain("Giveaway");
    expect(pageSource).toContain("hasVoteBlock");
  });

  it("uses a two-step inline confirm for archive, not window.confirm", () => {
    const pageSource = readFileSync("src/app/xeventsy/page.tsx", "utf8");

    expect(pageSource).toContain("Confirm archive");
    expect(pageSource).toContain("Cancel");
    expect(pageSource).not.toContain("window.confirm");
    expect(pageSource).not.toContain("alert(");
  });

  it("colors status chips by time state and has an empty state", () => {
    const pageSource = readFileSync("src/app/xeventsy/page.tsx", "utf8");

    for (const state of ["draft", "scheduled", "live", "closed", "resolved", "ended", "archived"]) {
      expect(pageSource).toContain(`${state}:`);
    }
    expect(pageSource).toContain("No event modals yet");
  });

  it("is registered in the admin sidebar in the Product group", () => {
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(navSource).toContain('{ href: "/xeventsy", label: "Modals", full: "Event modals", Icon: Megaphone }');
    expect(navSource).toMatch(/title: "Product", hrefs: \[[^\]]*"\/xeventsy"/);
  });
});
