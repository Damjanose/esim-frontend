import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/account/[orderId]/page.tsx", "utf8");
const topUp = readFileSync("src/app/account/[orderId]/TopUpPanel.tsx", "utf8");
const copy = readFileSync("src/app/account/[orderId]/CopyField.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/account/[orderId] layout", () => {
  it("puts the usage card (blue below lg, ring at lg) beside the install card", () => {
    expect(page).toContain('className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start"');
    expect(page).toContain('<div className="lg:hidden">\n                <ActiveEsimCard');
    expect(page).toContain('<div className="hidden lg:block">\n                <UsageRingCard');
    expect(page).toContain('id="install"');
    expect(page).toContain('items={accountShellItems("esims")}');
  });

  it("keeps both banners and the purchase conversion exactly where they were", () => {
    expect(page).toContain('isNew === "1"');
    expect(page).toContain("<PurchaseConversion transactionId={order.code} />");
    expect(page).toContain("Payment complete — your eSIM is ready");
    expect(page).toContain('isToppedUp === "1"');
    expect(page).toContain("Top-up complete");
  });

  it("uses tokens only and 44px controls", () => {
    expect(page).not.toContain("amber-");
    expect(page).not.toMatch(HEX);
    expect(page).toContain("min-h-11");
    expect(copy).toContain("h-11 w-11");
  });
});

describe("TopUpPanel", () => {
  it("lists offers as PlanRow-style rows; the hosted Pokpay flow is unchanged", () => {
    expect(topUp).toContain('id="top-up"');
    expect(topUp).toContain("<PlanDataDisc plan={plan} />");
    expect(topUp).toContain("<PlanPrice plan={plan} />");
    expect(topUp).toContain("planRowTags(plan, { position: null })");
    expect(topUp).toContain('fetch("/bff/payments/topups/intent"');
    expect(topUp).toContain("window.location.assign(payload.data.checkoutUrl)");
    // Every row's Top up is flat: the page's one gradient is the usage card's.
    expect(topUp).toContain('variant="tint"');
    expect(topUp).not.toContain('variant="lit"');
  });
});
