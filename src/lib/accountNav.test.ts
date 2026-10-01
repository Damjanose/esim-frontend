import { describe, expect, it } from "vitest";
import { ACCOUNT_NAV, profileGroupClass, profileTabFromParam } from "./accountNav";

describe("ACCOUNT_NAV", () => {
  it("lists the spec's sidebar, with Profile's tabs as ?tab= links", () => {
    expect(ACCOUNT_NAV.map((entry) => [entry.label, entry.href])).toEqual([
      ["My eSIMs", "/account"],
      ["Account", "/profile"],
      ["Sign-in methods", "/profile?tab=signin"],
      ["Payments", "/profile?tab=payments"],
      ["Support", "/profile?tab=support"],
      ["Legal", "/profile?tab=legal"]
    ]);
  });
});

describe("profileTabFromParam", () => {
  it("accepts the known tabs and falls back to Account for anything else", () => {
    expect(profileTabFromParam(undefined)).toBe("account");
    expect(profileTabFromParam("signin")).toBe("signin");
    expect(profileTabFromParam(["legal", "support"])).toBe("legal");
    expect(profileTabFromParam("bogus")).toBe("account");
    expect(profileTabFromParam("")).toBe("account");
  });
});

describe("profileGroupClass", () => {
  it("shows every group below lg and only the selected one at lg", () => {
    expect(profileGroupClass("signin", "signin")).toBe("");
    expect(profileGroupClass("account", "signin")).toBe("lg:hidden");
  });
});
