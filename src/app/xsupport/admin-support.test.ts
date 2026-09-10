import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin support inbox", () => {
  it("publishes a hidden /xsupport route without adding public navigation links", () => {
    expect(existsSync("src/app/xsupport/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const pageSource = readFileSync("src/app/xsupport/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xsupport");
    expect(pageSource).toContain('"use client"');
  });

  it("sets noindex metadata on the support layout, matching the other hidden admin pages", () => {
    expect(existsSync("src/app/xsupport/layout.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xsupport/layout.tsx", "utf8");
    expect(layoutSource).toContain("indexable: false");
  });

  it("uses the shared admin session hook instead of duplicating login logic", () => {
    const pageSource = readFileSync("src/app/xsupport/page.tsx", "utf8");
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(pageSource).toContain("useAdminSession");
    expect(hookSource).toContain("/bff/admin/login");
  });

  it("renders the inbox tabs, live chat, and BFF support routes", () => {
    const pageSource = readFileSync("src/app/xsupport/page.tsx", "utf8");
    const inboxSource = readFileSync("src/app/xsupport/SupportInbox.tsx", "utf8");

    expect(pageSource).toContain("SupportInbox");
    expect(inboxSource).toContain("/bff/admin/support/threads");
    expect(inboxSource).toContain("/bff/admin/support/threads/");
    expect(inboxSource).toContain("/read");
    expect(inboxSource).toContain("/solved");
    expect(inboxSource).toContain("/attachments");
    expect(inboxSource).toContain("Mark as solved");
    expect(inboxSource).toContain("Unread");
  });

  it("fits opened attachment previews inside the viewport instead of cropping them", () => {
    const inboxSource = readFileSync("src/app/xsupport/SupportInbox.tsx", "utf8");

    expect(inboxSource).toContain('alt="Support attachment preview"');
    expect(inboxSource).toContain("max-h-[90vh]");
    expect(inboxSource).toContain("max-w-[90vw]");
    expect(inboxSource).toContain("object-contain");
    expect(inboxSource).not.toContain("max-h-full max-w-full rounded-2xl object-contain");
  });

  it("exposes manual refresh controls for the reports list", () => {
    const inboxSource = readFileSync("src/app/xsupport/SupportInbox.tsx", "utf8");

    expect(inboxSource).toContain("Refresh conversations");
    expect(inboxSource).toContain("loadThreads(tabRef.current)");
  });

  it("invalidates in-flight conversation actions when selection changes", () => {
    const inboxSource = readFileSync("src/app/xsupport/SupportInbox.tsx", "utf8");

    expect(inboxSource).toContain("threadRequestRef.current += 1");
    expect(inboxSource).toContain("selectedIdRef.current !== activeThreadId");
  });

  it("renders hidden admin navigation including support inbox", () => {
    const pageSource = readFileSync("src/app/xsupport/page.tsx", "utf8");
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(pageSource).toContain("AdminNav");
    expect(navSource).toContain("/xsupport");
    expect(navSource).toContain("Support inbox");
  });

  it("adds local admin API proxy routes for list, thread, messages, attachments, read, and solved", () => {
    expect(existsSync("src/app/bff/admin/support/threads/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/support/threads/[id]/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/support/threads/[id]/messages/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/support/threads/[id]/attachments/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/support/threads/[id]/read/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/support/threads/[id]/solved/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/support/attachments/[id]/route.ts")).toBe(true);
  });
});
