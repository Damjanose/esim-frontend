import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin mailbox page shell", () => {
  it("sets noindex metadata on the mailbox layout at /xmailx", () => {
    expect(existsSync("src/app/xmailx/layout.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xmailx/layout.tsx", "utf8");
    expect(layoutSource).toContain('path: "/xmailx"');
    expect(layoutSource).toContain("indexable: false");
  });

  it("mirrors the support page: shared session hook, login card, nav and header", () => {
    const pageSource = readFileSync("src/app/xmailx/page.tsx", "utf8");

    expect(pageSource).toContain('"use client"');
    expect(pageSource).toContain("useAdminSession");
    expect(pageSource).toContain("AdminLoginCard");
    expect(pageSource).toContain("AdminNav");
    expect(pageSource).toContain("Mailbox");
    expect(pageSource).toContain("MailInbox");
    expect(pageSource).toContain("handleUnauthorized");
  });

  it("adds the Mail entry to the admin nav without renaming existing routes", () => {
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(navSource).toContain('{ href: "/xmailx", label: "Mail", full: "Mailbox", Icon: Mail }');
    expect(navSource).toMatch(/import \{[^}]*\bMail\b[^}]*\} from "lucide-react"/);
    expect(navSource).toContain('href: "/xsupport"');
  });
});

describe("admin mailbox inbox", () => {
  it("loads accounts, folders and messages through the admin BFF with the bearer token", () => {
    const inboxSource = readFileSync("src/app/xmailx/MailInbox.tsx", "utf8");

    expect(inboxSource).toContain('"use client"');
    expect(inboxSource).toContain("/bff/admin/mail/accounts");
    expect(inboxSource).toContain("/bff/admin/mail/${encodeURIComponent(");
    expect(inboxSource).toContain("/folders");
    expect(inboxSource).toContain("/messages");
    expect(inboxSource).toContain("Authorization: `Bearer ${token}`");
  });

  it("handles 401, 502 and stale responses", () => {
    const inboxSource = readFileSync("src/app/xmailx/MailInbox.tsx", "utf8");

    expect(inboxSource).toContain("handleUnauthorized");
    expect(inboxSource).toContain("status === 401");
    expect(inboxSource).toContain("Mail server unavailable");
    expect(inboxSource).toContain("status === 502");
    expect(inboxSource).toContain("isStale");
  });

  it("polls every 30 seconds only while the tab is visible", () => {
    const inboxSource = readFileSync("src/app/xmailx/MailInbox.tsx", "utf8");

    expect(inboxSource).toContain("30_000");
    expect(inboxSource).toContain("document.visibilityState");
    expect(inboxSource).toContain("visibilitychange");
  });

  it("remembers the last account in localStorage inside try/catch", () => {
    const inboxSource = readFileSync("src/app/xmailx/MailInbox.tsx", "utf8");

    expect(inboxSource).toContain("localStorage");
    expect(inboxSource).toMatch(/try \{[\s\S]*localStorage[\s\S]*\} catch/);
  });

  it("uses reducer actions for account changes and the three-pane layout", () => {
    const inboxSource = readFileSync("src/app/xmailx/MailInbox.tsx", "utf8");

    expect(inboxSource).toContain("mailStateReducer");
    expect(inboxSource).toContain('type: "selectAccount"');
    expect(inboxSource).toContain("<select");
    expect(inboxSource).toContain("lg:");
    expect(inboxSource).toContain("<MailReader");
    expect(inboxSource).toContain("resolveButtonClasses");
  });

  it("keeps a placeholder MailReader slot that Task 9 can fill", () => {
    expect(existsSync("src/app/xmailx/MailReader.tsx")).toBe(true);

    const readerSource = readFileSync("src/app/xmailx/MailReader.tsx", "utf8");
    expect(readerSource).toContain("export function MailReader");
    expect(readerSource).toContain("onClose");
  });
});

describe("admin mailbox compose", () => {
  it("opens a native dialog with showModal and resets on close", () => {
    const composeSource = readFileSync("src/app/xmailx/MailCompose.tsx", "utf8");

    expect(composeSource).toContain("<dialog");
    expect(composeSource).toContain("showModal()");
    expect(composeSource).toContain("dialog.close()");
    expect(composeSource).toContain("onCancel");
  });

  it("posts multipart to the send route with the bearer token and the shared field builder", () => {
    const composeSource = readFileSync("src/app/xmailx/MailCompose.tsx", "utf8");

    expect(composeSource).toContain("/bff/admin/mail/${encodeURIComponent(account)}/send");
    expect(composeSource).toContain("Authorization: `Bearer ${token}`");
    expect(composeSource).toContain("buildSendFormData");
    expect(composeSource).toContain("status === 401");
    expect(composeSource).toContain("handleUnauthorized");
  });

  it("has accessible labels, an aria-live error region and a disabled Send while sending", () => {
    const composeSource = readFileSync("src/app/xmailx/MailCompose.tsx", "utf8");

    expect(composeSource).toContain('aria-live="assertive"');
    expect(composeSource).toContain('role="alert"');
    expect(composeSource).toContain('htmlFor={toId}');
    expect(composeSource).toContain('htmlFor={subjectId}');
    expect(composeSource).toContain("disabled={sending}");
    expect(composeSource).toContain("resolveButtonClasses");
  });

  it("is wired from the inbox: Compose button, reply prefill and refresh after send", () => {
    const inboxSource = readFileSync("src/app/xmailx/MailInbox.tsx", "utf8");

    expect(inboxSource).toContain("<MailCompose");
    expect(inboxSource).toContain("handleCompose");
    expect(inboxSource).toContain("buildReply(message, { all: options.all, myAddress: activeAddress })");
    expect(inboxSource).toContain("onSent={() => void refresh()}");
    expect(inboxSource).not.toContain("Task 10 opens");
  });
});
