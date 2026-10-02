import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const billing = readFileSync("src/app/profile/billing/page.tsx", "utf8");
const form = readFileSync("src/app/profile/billing/BillingForm.tsx", "utf8");
const goodbye = readFileSync("src/app/profile/deleted/page.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/profile/billing and /profile/deleted restyle", () => {
  it("billing sits in the account shell with Payments current, tokens only", () => {
    expect(billing).toContain('items={accountShellItems("payments")}');
    expect(billing).toContain("overflow-x-clip");
    expect(billing).not.toContain("amber-");
    expect(billing).not.toMatch(HEX);
    expect(billing).toContain("min-h-11");
  });

  it("billing form uses the shared 48px fields with focus rings", () => {
    expect(form).toContain("className={FIELD_INPUT_CLASSES}");
    expect(form).toContain("className={FIELD_LABEL_CLASSES}");
    expect(form).not.toContain("INPUT_CLASSNAME");
  });

  it("goodbye page is the centred status card, still with no session", () => {
    expect(goodbye).toContain("rounded-[24px]");
    expect(goodbye).not.toContain("AccountShell");
    expect(goodbye).not.toContain("cookies");
  });
});
