import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ROUTES = {
  accounts: "src/app/bff/admin/mail/accounts/route.ts",
  folders: "src/app/bff/admin/mail/[account]/folders/route.ts",
  messages: "src/app/bff/admin/mail/[account]/messages/route.ts",
  message: "src/app/bff/admin/mail/[account]/messages/[uid]/route.ts",
  move: "src/app/bff/admin/mail/[account]/messages/[uid]/move/route.ts",
  attachment: "src/app/bff/admin/mail/[account]/messages/[uid]/attachments/[partId]/route.ts",
  send: "src/app/bff/admin/mail/[account]/send/route.ts"
};

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("admin mailbox types", () => {
  it("exports the mail account, folder, summary and full message shapes", () => {
    expect(existsSync("src/lib/mail-types.ts")).toBe(true);

    const source = read("src/lib/mail-types.ts");
    expect(source).toContain("export type MailAccount");
    expect(source).toContain("export type MailFolder");
    expect(source).toContain("export type MailMessageSummary");
    expect(source).toContain("export type MailMessage");
    expect(source).toContain("hasAttachments");
    expect(source).toContain("references");
    expect(source).toContain("attachments");
    expect(source).toContain("specialUse");
  });
});

describe("admin mailbox BFF routes", () => {
  it("creates every mail proxy route under src/app/bff (never src/app/api)", () => {
    for (const path of Object.values(ROUTES)) {
      expect(existsSync(path), path).toBe(true);
      expect(path.startsWith("src/app/bff/admin/mail/")).toBe(true);
    }
    expect(existsSync("src/app/api/admin/mail")).toBe(false);
  });

  it("forwards the accounts list and folder list to the matching backend paths", () => {
    expect(read(ROUTES.accounts)).toContain("/admin/mail/accounts");
    expect(read(ROUTES.folders)).toContain("encodeURIComponent");
    expect(read(ROUTES.folders)).toContain("/folders`");
  });

  it("forwards folder and page query params on the message list", () => {
    const source = read(ROUTES.messages);
    expect(source).toContain("/messages");
    expect(source).toContain('searchParams.get("folder")');
    expect(source).toContain('searchParams.get("page")');
  });

  it("serves message GET and DELETE with the folder query, and move as POST", () => {
    const source = read(ROUTES.message);
    expect(source).toContain("export async function GET");
    expect(source).toContain("export async function DELETE");
    expect(source).toContain('searchParams.get("folder")');
    expect(source).toContain('method: "DELETE"');

    const moveSource = read(ROUTES.move);
    expect(moveSource).toContain("export async function POST");
    expect(moveSource).toContain("/move`");
  });

  it("streams attachments through backendFetchBinary with the folder query", () => {
    const source = read(ROUTES.attachment);
    expect(source).toContain("backendFetchBinary");
    expect(source).toContain("export async function GET");
    expect(source).toContain('searchParams.get("folder")');
    expect(source).toContain("encodeURIComponent");
  });

  it("sends mail as multipart through backendFetchFormData", () => {
    const source = read(ROUTES.send);
    expect(source).toContain("backendFetchFormData");
    expect(source).toContain("request.formData()");
    expect(source).toContain("/send`");
    expect(source).toContain("export async function POST");
  });

  it("passes the admin bearer on every route and encodes path params", () => {
    for (const [name, path] of Object.entries(ROUTES)) {
      const source = read(path);
      const usesBearer = source.includes("readAdminBearer") || source.includes("proxyAdminJson");
      expect(usesBearer, `${name} must forward the admin bearer`).toBe(true);
      if (path.includes("[account]")) {
        expect(source, `${name} must encode the account param`).toContain("encodeURIComponent");
      }
    }
  });
});
