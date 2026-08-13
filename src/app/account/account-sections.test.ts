import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const accountPage = readFileSync("src/app/account/page.tsx", "utf8");
const detailPage = readFileSync("src/app/account/[orderId]/page.tsx", "utf8");

describe("account plan sections", () => {
  it("splits plans into active, ready, and history", () => {
    expect(accountPage).toContain("resolveOrderSections");
    expect(accountPage).toContain('title="Active plan"');
    expect(accountPage).toContain('title="Ready to use"');
    expect(accountPage).toContain('title="History"');
  });

  it("asks for the active plan before the list, so the list reflects any expiry", () => {
    const activeCall = accountPage.indexOf('"/orders/active"');
    const listCall = accountPage.indexOf('"/orders"');

    expect(activeCall).toBeGreaterThan(-1);
    expect(listCall).toBeGreaterThan(activeCall);
  });

  it("fetches usage only for the live plan, not once per plan", () => {
    const usageCalls = accountPage.match(/\/usage`/g) ?? [];
    expect(usageCalls).toHaveLength(1);
    expect(accountPage).toContain("activeOrder\n      ?");
  });

  it("still shows the empty state when nothing has been bought", () => {
    expect(accountPage).toContain("No eSIMs yet");
    expect(accountPage).toContain('href="/destinations"');
  });
});

describe("eSIM detail plan history", () => {
  it("loads the per-eSIM plan history alongside usage and instructions", () => {
    expect(detailPage).toContain("/packages`");
    expect(detailPage).toContain("Plan history");
  });

  it("degrades to the install and usage panels when the history call fails", () => {
    expect(detailPage).toContain("packagesResult.ok ? packagesResult.data.packages : []");
  });

  it("keeps the wide history table scrollable rather than overflowing the page", () => {
    expect(detailPage).toContain("overflow-x-auto");
  });
});
