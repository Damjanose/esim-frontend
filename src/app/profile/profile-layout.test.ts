import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/profile/page.tsx", "utf8");
const tabs = readFileSync("src/app/profile/ProfileTabs.tsx", "utf8");
const deleteCard = readFileSync("src/app/profile/DeleteAccountCard.tsx", "utf8");
const linked = readFileSync("src/app/profile/LinkedProviders.tsx", "utf8");
const signOut = readFileSync("src/app/components/SignOutButton.tsx", "utf8");

describe("/profile layout (sidebar sections at lg, grouped list below)", () => {
  it("selects the lg section from ?tab= on the server, through the shared sidebar", () => {
    expect(page).toContain("profileTabFromParam((await searchParams).tab)");
    expect(page).toContain("items={accountShellItems(tab)}");
    expect(page).toContain('<SignOutButton appearance="nav" />');
    expect(page).toContain("overflow-x-clip");
  });

  it("renders every group once; profileGroupClass hides the unselected ones at lg only", () => {
    expect(tabs).not.toContain('"use client"');
    expect(tabs).not.toContain("useState");
    for (const id of ["account", "signin", "payments", "support", "legal"]) {
      expect(tabs).toContain(`profileGroupClass("${id}", tab)`);
    }
    expect(tabs.match(/<SignOutButton/g)).toHaveLength(1);
    expect(tabs.match(/<DeleteAccountCard/g)).toHaveLength(1);
    expect(tabs).toContain('<SettingsGroup className="lg:hidden">');
    expect(existsSync("src/app/components/SettingsSection.tsx")).toBe(false);
  });

  it("never paints sign-out or delete as a gradient or solid red", () => {
    expect(signOut).not.toContain("<Button");
    expect(deleteCard).toContain('tone="danger" type="button" variant="flat"');
    expect(deleteCard).not.toContain('variant="primary"');
  });

  it("gives Unlink a 46px flat button inside the card's hairline rows", () => {
    expect(linked).toContain('variant="flat"');
    expect(linked).not.toContain("h-9");
    expect(linked).toContain("divide-y divide-outline/60");
  });
});
