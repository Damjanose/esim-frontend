import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardPage = readFileSync("src/app/partners/dashboard/page.tsx", "utf8");
const walletPanel = readFileSync("src/app/partners/dashboard/WalletPanel.tsx", "utf8");

describe("partner dashboard page wiring WalletPanel", () => {
  it("imports and renders WalletPanel alongside the existing stats/commissions", () => {
    expect(dashboardPage).toContain('import { WalletPanel } from "./WalletPanel"');
    expect(dashboardPage).toContain("<WalletPanel />");
  });
});

describe("WalletPanel", () => {
  it("is a client component", () => {
    expect(walletPanel).toContain('"use client"');
  });

  it("offers the €25/50/100/250 quick top-up amounts plus a custom amount", () => {
    for (const amount of [25, 50, 100, 250]) {
      expect(walletPanel).toContain(`${amount}`);
    }
    expect(walletPanel).toContain("customAmount");
  });

  it("starts a Pokpay-hosted top-up via the partner wallet topup BFF route", () => {
    expect(walletPanel).toContain('"/bff/partners/me/wallet/topup"');
    expect(walletPanel).toContain('method: "POST"');
    expect(walletPanel).toContain("amountCents");
  });

  it("redirects the browser to the returned Pokpay checkout URL", () => {
    expect(walletPanel).toContain("payload.data?.checkoutUrl");
    expect(walletPanel).toContain("window.location.assign(payload.data.checkoutUrl)");
  });

  it("redirects to sign-in on an expired/missing session, for both top-up and transfer", () => {
    expect(walletPanel).toContain("response.status === 401");
    expect(walletPanel).toContain('window.location.assign(`/signin?next=');
  });

  it("submits the transfer-to-wallet action against the transfer BFF route", () => {
    expect(walletPanel).toContain('"/bff/partners/me/wallet/transfer"');
  });

  it("refreshes the router after a successful transfer so dashboard balances update", () => {
    expect(walletPanel).toContain("router.refresh()");
  });

  it("links onward to the buy and withdraw pages", () => {
    expect(walletPanel).toContain('href="/partners/buy"');
    expect(walletPanel).toContain('href="/partners/withdraw"');
  });
});
