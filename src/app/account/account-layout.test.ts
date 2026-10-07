import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/account/page.tsx", "utf8");
const row = readFileSync("src/app/account/EsimListRow.tsx", "utf8");
const loading = readFileSync("src/app/account/loading.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/account layout (desktop sidebar dashboard, phone My eSIMs)", () => {
  it("fetches once and switches only the active plan's presentation at lg", () => {
    expect(page.match(/fetchForPage</g)).toHaveLength(3);
    expect(page).toContain('<div className="lg:hidden">\n        <ActiveEsimCard');
    expect(page).toContain('<div className="hidden lg:block">\n        <UsageRingCard');
    expect(existsSync("src/app/account/PlanCard.tsx")).toBe(false);
  });

  it("sits in the AccountShell, sticky-safe, with the count line under the title", () => {
    expect(page).toContain('items={accountShellItems("esims")}');
    expect(page).toContain("overflow-x-clip");
    expect(page).not.toContain("overflow-x-hidden");
    expect(page).toContain("esimCountLine(sections)");
  });

  it("gives one gradient: accountPrimaryAction picks Install or Top up; Buy again only while sold", () => {
    expect(page).toContain("accountPrimaryAction(sections)");
    expect(page).toContain('primaryTopUp={primary?.kind === "topup"}');
    expect(page).toContain('primary: primary?.kind === "install" && primary.orderId === order.id');
    expect(page).toContain("buyAgainHref(order.package_id, catalog)");
    expect(page).toContain('again ? { kind: "buy-again", href: again } : null');
  });

  it("uses tokens only (no amber, no hex)", () => {
    expect(page).not.toContain("amber-");
    expect(page).not.toMatch(HEX);
    expect(row).not.toMatch(HEX);
  });
});

describe("EsimListRow", () => {
  it("makes the whole row open the eSIM without nesting the action in a link", () => {
    expect(row).toContain("after:absolute after:inset-0");
    expect(row).toContain("relative z-10 shrink-0");
    expect(row).toContain('variant={action.primary ? "lit" : "tint"}');
    // Buy again is a 44px text action, never a gradient.
    expect(row).toContain("min-h-11");
  });
});

describe("/account loading", () => {
  it("is shaped like the page and still under reduced motion", () => {
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("motion-safe:animate-pulse");
    expect(loading).toContain("lg:grid-cols-[240px_minmax(0,1fr)]");
  });
});
