import { describe, expect, it } from "vitest";
import { crawlRel, isNoindexPath } from "./robots-policy";

describe("crawl policy", () => {
  it("treats private HTML routes as noindex but not the public pages next to them", () => {
    for (const path of ["/checkout", "/signin", "/profile/billing", "/account/12", "/partners/request", "/trip-plan/abc", "/pkg/x", "/esim/id/t"]) {
      expect(isNoindexPath(path)).toBe(true);
    }
    for (const path of ["/", "/trip-plan", "/esim/japan", "/destinations", "/accounts-faq"]) {
      expect(isNoindexPath(path)).toBe(false);
    }
  });

  it("nofollows links into private routes and unknown-country views only", () => {
    expect(crawlRel("/checkout?package=abc")).toBe("nofollow");
    expect(crawlRel("/signin?next=%2Ftrip-plan")).toBe("nofollow");
    expect(crawlRel("/profile")).toBe("nofollow");
    expect(crawlRel("/destinations?country=kenya")).toBe("nofollow");
    expect(crawlRel("/destinations")).toBeUndefined();
    expect(crawlRel("/esim/croatia")).toBeUndefined();
    expect(crawlRel("mailto:esim2you@uplisoft.com")).toBeUndefined();
  });
});
