import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "../../components/retiredTokens";

const read = (name: string) => readFileSync(`src/app/partners/dashboard/${name}`, "utf8");
const page = read("page.tsx");
const wallet = read("WalletPanel.tsx");
const discount = read("DiscountPanel.tsx");
const qr = read("QrCodeCard.tsx");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/partners/dashboard layout (account shell, blue wallet card)", () => {
  it("sits in the AccountShell with the partner items, sticky-safe, with Sign out in the footer", () => {
    expect(page).toContain('items={partnerShellItems("dashboard")}');
    expect(page).toContain('label="Partner"');
    expect(page).toContain('footer={<SignOutButton appearance="nav" />}');
    expect(page).toContain("overflow-x-clip");
    expect(page).not.toContain("overflow-x-hidden");
  });

  it("lists the partner sub-pages as a SettingsGroup on phones only", () => {
    expect(page).toContain('<SettingsGroup className="lg:hidden"');
    expect(page).toContain("SettingsLinkRow");
    expect(page).toContain("PARTNER_NAV");
  });

  it("shows the wallet balance in the blue card, passed from the dashboard data", () => {
    expect(page).toContain("<WalletPanel walletBalanceCents={dashboard.walletBalanceCents} />");
    expect(wallet).toContain("walletBalanceCents: number");
    expect(wallet).toContain("bg-brandBlue");
    expect(wallet).toContain("text-surface");
    expect(wallet).toContain("formatMoney(walletBalanceCents)");
  });

  it("renders the discount panel and QR code as white tiles", () => {
    expect(discount).toContain("bg-surface");
    expect(qr).toContain("bg-surface");
    expect(page).toContain("TILE_CLASSES");
  });

  it("uses the shared field classes and 44px controls", () => {
    expect(wallet).toContain("FIELD_CONTROL_CLASSES");
    expect(discount).toContain("FIELD_CONTROL_CLASSES");
    for (const source of [wallet, discount]) {
      expect(source).not.toContain("h-10 ");
      expect(source).toContain("min-h-11");
    }
  });

  it("uses no gradient on the ready dashboard: the blue card is the emphasis, every button is flat", () => {
    for (const source of [wallet, discount]) {
      expect(source).not.toContain('variant="primary"');
      expect(source.match(/<(?:Link)?Button\b/g)?.length).toBe(source.match(/variant="flat"/g)?.length);
    }
  });

  it("keeps to tokens: no retired classes, amber, white, or hex", () => {
    for (const source of [page, wallet, discount, qr]) {
      expect(source).not.toMatch(RETIRED_COLOR_CLASS);
      expect(source).not.toContain("amber-");
      expect(source).not.toMatch(/\bbg-white\b/);
      expect(source).not.toMatch(HEX);
    }
  });

  it("keeps the gating and data logic", () => {
    expect(page).toContain('new Set(["Pending", "Active"])');
    expect(page).toContain('fetchForPage<Dashboard>("/partners/me/dashboard", "/partners/dashboard")');
  });
});
