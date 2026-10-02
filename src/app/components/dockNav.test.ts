import { describe, expect, it } from "vitest";
import { DOCK_ITEMS, activeDockItem, isDockVisible } from "./dockNav";

describe("DOCK_ITEMS", () => {
  it("mirrors the app tab order with Destinations as the single center action", () => {
    expect(DOCK_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/account",
      "/destinations",
      "/support",
      "/profile"
    ]);
    expect(DOCK_ITEMS.filter((item) => item.center).map((item) => item.id)).toEqual([
      "destinations"
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
  it("only marks Home on the exact root", () => {
    expect(activeDockItem("/")).toBe("home");
    expect(activeDockItem("/travel")).toBeNull();
  });

  it("maps destination, plan and package pages to the center Destinations tab", () => {
    expect(activeDockItem("/destinations")).toBe("destinations");
    expect(activeDockItem("/esim/japan")).toBe("destinations");
    expect(activeDockItem("/pkg/abc")).toBe("destinations");
    expect(activeDockItem("/esimguide")).toBeNull();
  });

  it("maps account, support and profile sub-routes to their tabs", () => {
    expect(activeDockItem("/account/7")).toBe("esims");
    expect(activeDockItem("/support")).toBe("support");
    expect(activeDockItem("/profile/billing")).toBe("profile");
  });

  it("returns null for an unknown pathname", () => {
    expect(activeDockItem(null)).toBeNull();
  });
});
