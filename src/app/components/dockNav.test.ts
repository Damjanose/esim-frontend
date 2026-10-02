import { describe, expect, it } from "vitest";
import { DOCK_ITEMS, activeDockItem, isDockVisible } from "./dockNav";

describe("DOCK_ITEMS", () => {
  it("mirrors the app's three tabs with Marketplace (the homepage) in the center", () => {
    expect(DOCK_ITEMS.map((item) => item.href)).toEqual(["/account", "/", "/profile"]);
    expect(DOCK_ITEMS.filter((item) => item.center).map((item) => item.id)).toEqual([
      "marketplace"
    ]);
  });
});

describe("isDockVisible", () => {
  it("shows the dock on public browsing and account routes", () => {
    for (const path of ["/", "/destinations", "/esim/usa", "/account", "/account/42", "/profile", "/support", "/partners/dashboard", "/trip-plan"]) {
      expect(isDockVisible(path)).toBe(true);
    }
  });

  it("hides the dock where it would compete with a form's primary action", () => {
    for (const path of ["/checkout", "/checkout/failed", "/signin", "/profile/deleted", "/trip-plan/abc123"]) {
      expect(isDockVisible(path)).toBe(false);
    }
  });

  it("matches whole path segments, not string prefixes", () => {
    expect(isDockVisible("/checkouts-guide")).toBe(true);
    expect(isDockVisible("/signing")).toBe(true);
  });

  it("defaults to visible when the pathname is unknown", () => {
    expect(isDockVisible(null)).toBe(true);
  });
});

describe("activeDockItem", () => {
  it("marks Marketplace on the exact root only, not on other content pages", () => {
    expect(activeDockItem("/")).toBe("marketplace");
    expect(activeDockItem("/travel")).toBeNull();
    expect(activeDockItem("/support")).toBeNull();
  });

  it("maps destination, plan and package pages to the center Marketplace tab", () => {
    expect(activeDockItem("/destinations")).toBe("marketplace");
    expect(activeDockItem("/esim/japan")).toBe("marketplace");
    expect(activeDockItem("/pkg/abc")).toBe("marketplace");
    expect(activeDockItem("/esimguide")).toBeNull();
  });

  it("maps account and profile sub-routes to their tabs", () => {
    expect(activeDockItem("/account/7")).toBe("esims");
    expect(activeDockItem("/profile/billing")).toBe("profile");
  });

  it("returns null for an unknown pathname", () => {
    expect(activeDockItem(null)).toBeNull();
  });
});
