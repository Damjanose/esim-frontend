import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { accountShellItems } from "../account/accountShellItems";

const shell = readFileSync("src/app/components/AccountShell.tsx", "utf8");
const group = readFileSync("src/app/components/SettingsGroup.tsx", "utf8");
const signOut = readFileSync("src/app/components/SignOutButton.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("AccountShell", () => {
  it("is a plain-props server component the partner pages can reuse", () => {
    expect(shell).not.toContain('"use client"');
    expect(shell).not.toMatch(/fetch\(|usePathname|cookies\(/);
    expect(shell).toContain("items: readonly AccountShellItem[]");
    expect(shell).not.toMatch(HEX);
  });

  it("shows the sidebar from lg only, sticky, and marks the current page", () => {
    expect(shell).toContain('className="hidden lg:block lg:self-stretch"');
    expect(shell).toContain("sticky top-6");
    expect(shell).toContain('aria-current={current ? "page" : undefined}');
    // 44px rows.
    expect(shell).toContain("min-h-11");
  });

  it("lists the account area's sidebar and flags exactly one current entry", () => {
    const items = accountShellItems("payments");
    expect(items.map((item) => item.label)).toEqual([
      "My eSIMs",
      "Account",
      "Sign-in methods",
      "Payments",
      "Support",
      "Legal"
    ]);
    expect(items.filter((item) => item.current).map((item) => item.href)).toEqual(["/profile?tab=payments"]);
    expect(accountShellItems(null).some((item) => item.current)).toBe(false);
  });
});

describe("SettingsGroup and SignOutButton", () => {
  it("groups rows in one hairline-split card with a caps label, rows at least 56px", () => {
    expect(group).toContain("divide-y divide-outline/60");
    expect(group).toContain("text-label-caps uppercase");
    expect(group).toContain("min-h-14");
    expect(group).not.toMatch(HEX);
  });

  it("signs out through the BFF in every appearance, with 44px+ targets", () => {
    expect(signOut).toContain('fetch("/bff/auth/signout", { method: "POST" })');
    expect(signOut).toContain("min-h-11");
    expect(signOut).toContain("min-h-14");
  });
});
