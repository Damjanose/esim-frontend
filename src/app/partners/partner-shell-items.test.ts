import { describe, expect, it } from "vitest";
import { PARTNER_NAV, partnerShellItems, type PartnerNavId } from "./partnerShellItems";

describe("partnerShellItems", () => {
  it("lists the partner pages in order, each at its real route", () => {
    expect(PARTNER_NAV.map((entry) => [entry.label, entry.href])).toEqual([
      ["Dashboard", "/partners/dashboard"],
      ["Buy for a customer", "/partners/buy"],
      ["Withdraw", "/partners/withdraw"],
      ["Materials", "/partners/materials"],
      ["Status", "/partners/status"]
    ]);
  });

  it("marks exactly the current page, or none", () => {
    for (const entry of PARTNER_NAV) {
      const current = partnerShellItems(entry.id as PartnerNavId).filter((item) => item.current);
      expect(current.map((item) => item.href)).toEqual([entry.href]);
    }
    expect(partnerShellItems(null).some((item) => item.current)).toBe(false);
  });

  it("gives every item an icon", () => {
    for (const item of partnerShellItems("dashboard")) {
      expect(item.icon).toBeTruthy();
    }
  });
});
