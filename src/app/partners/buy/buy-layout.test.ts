import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "../../components/retiredTokens";

const page = readFileSync("src/app/partners/buy/page.tsx", "utf8");
const picker = readFileSync("src/app/partners/buy/PackagePicker.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/partners/buy layout (account shell, plan-row picker)", () => {
  it("sits in the AccountShell with the partner items, sticky-safe, Sign out in the footer", () => {
    expect(page).toContain('items={partnerShellItems("buy")}');
    expect(page).toContain('label="Partner"');
    expect(page).toContain('footer={<SignOutButton appearance="nav" />}');
    expect(page).toContain("overflow-x-clip");
    expect(page).not.toContain("overflow-x-hidden");
  });

  it("builds the package rows from the PlanRow pieces", () => {
    expect(picker).toContain('import { PlanDataDisc, PlanPrice } from "@/app/components/PlanRow"');
    expect(picker).toContain("<PlanDataDisc plan={option} />");
    expect(picker).toContain("<PlanPrice plan={option} />");
    expect(picker).toContain("min-h-14");
  });

  it("shows the balance on the blue card and uses the shared field classes", () => {
    expect(picker).toContain("bg-brandBlue");
    expect(picker).toContain("FIELD_CONTROL_CLASSES");
  });

  it("gives one gradient: Buy with wallet; the toggles are 44px flat controls", () => {
    expect(picker.match(/<Button\b/g)).toHaveLength(1);
    expect(picker).not.toContain('variant="tint"');
    expect(page).not.toContain('variant="tint"');
    // The page's only other buttons are the empty-state links (mutually exclusive with the picker).
    expect(picker).toContain("flex min-h-11 flex-1");
    expect(picker.match(/\$\{TOGGLE_CLASSES\}/g)).toHaveLength(2);
  });

  it("keeps to tokens: no retired classes, amber, white, or hex", () => {
    for (const source of [page, picker]) {
      expect(source).not.toMatch(RETIRED_COLOR_CLASS);
      expect(source).not.toContain("amber-");
      expect(source).not.toMatch(/\bbg-white\b/);
      expect(source).not.toMatch(HEX);
    }
  });

  it("keeps the gating", () => {
    expect(page).toContain('new Set(["Pending", "Active"])');
  });
});
