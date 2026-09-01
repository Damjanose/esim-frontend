import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin notifications page", () => {
  it("publishes a hidden /xnotificationy route without adding public navigation links", () => {
    expect(existsSync("src/app/xnotificationy/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const pageSource = readFileSync("src/app/xnotificationy/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xnotificationy");
    expect(pageSource).toContain('"use client"');
  });

  it("sets noindex metadata on the notifications layout, matching the other hidden admin pages", () => {
    expect(existsSync("src/app/xnotificationy/layout.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xnotificationy/layout.tsx", "utf8");
    expect(layoutSource).toContain("indexable: false");
  });

  it("uses the shared admin session hook instead of duplicating login logic", () => {
    const pageSource = readFileSync("src/app/xnotificationy/page.tsx", "utf8");
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(pageSource).toContain("useAdminSession");
    expect(hookSource).toContain("/bff/admin/login");
  });

  it("renders an add form and a list with edit, delete, and send actions", () => {
    const pageSource = readFileSync("src/app/xnotificationy/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/notifications");
    expect(pageSource).toContain("response.status === 401");
    expect(pageSource).toContain("Add notification");
    expect(pageSource).toContain('method: "PATCH"');
    expect(pageSource).toContain('method: "DELETE"');
    expect(pageSource).toContain("/send");
  });

  it("renders hidden admin navigation including push notifications", () => {
    const pageSource = readFileSync("src/app/xnotificationy/page.tsx", "utf8");
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(pageSource).toContain("AdminNav");
    expect(navSource).toContain("/xnotificationy");
    expect(navSource).toContain("Push notifications");
  });

  it("adds local admin API proxy routes for listing, creating, editing, deleting, and sending", () => {
    expect(existsSync("src/app/bff/admin/notifications/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/notifications/[id]/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/notifications/[id]/send/route.ts")).toBe(true);

    const listProxy = readFileSync("src/app/bff/admin/notifications/route.ts", "utf8");
    const editProxy = readFileSync("src/app/bff/admin/notifications/[id]/route.ts", "utf8");
    const sendProxy = readFileSync("src/app/bff/admin/notifications/[id]/send/route.ts", "utf8");

    expect(listProxy).toContain("/admin/notifications");
    expect(listProxy).toContain("backendFetch");
    expect(editProxy).toContain('method: "PUT"');
    expect(editProxy).toContain('method: "DELETE"');
    expect(sendProxy).toContain("/send");
    expect(sendProxy).toContain('method: "POST"');
  });

  it("allows a title-only or body-only notification and shows per-field errors only when both are empty", () => {
    const pageSource = readFileSync("src/app/xnotificationy/page.tsx", "utf8");

    expect(pageSource).not.toContain("!newTitle.trim() || !newBody.trim()");
    expect(pageSource).not.toContain("!editTitle.trim() || !editBody.trim()");
    expect(pageSource).toContain("!newTitle.trim() && !newBody.trim()");
    expect(pageSource).toContain("!editTitle.trim() && !editBody.trim()");
    expect(pageSource).toContain("newFieldsInvalid");
    expect(pageSource).toContain("editFieldsInvalid");
  });
});
