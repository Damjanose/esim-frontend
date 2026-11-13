import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSrcDoc, hasBlockedRemoteImages, restoreRemoteImages } from "./mail-html";

describe("restoreRemoteImages", () => {
  it("turns data-remote-src back into src and drops the marker attribute", () => {
    const html = '<p>Hi</p><img alt="logo" data-remote-src="https://cdn.example.com/logo.png">';

    expect(restoreRemoteImages(html)).toBe(
      '<p>Hi</p><img src="https://cdn.example.com/logo.png" alt="logo">'
    );
  });

  it("accepts single-quoted attribute values", () => {
    const html = "<img data-remote-src='https://cdn.example.com/a.gif' width='10'>";

    expect(restoreRemoteImages(html)).toBe('<img src="https://cdn.example.com/a.gif" width=\'10\'>');
  });

  it("replaces an existing placeholder src instead of duplicating it", () => {
    const html = '<img src="data:image/gif;base64,R0lGOD" data-remote-src="https://x.test/p.jpg" alt="p">';

    const restored = restoreRemoteImages(html);

    expect(restored).toBe('<img src="https://x.test/p.jpg" alt="p">');
    expect(restored.match(/src=/g)).toHaveLength(1);
  });

  it("leaves images without data-remote-src and non-image markup untouched", () => {
    const html = '<img src="cid:logo@x"><a href="https://example.com">link</a>';

    expect(restoreRemoteImages(html)).toBe(html);
  });

  it("does not mistake data-src for src", () => {
    const html = '<img data-src="https://x.test/no.png" data-remote-src="https://x.test/yes.png">';

    expect(restoreRemoteImages(html)).toBe('<img src="https://x.test/yes.png" data-src="https://x.test/no.png">');
  });
});

describe("hasBlockedRemoteImages", () => {
  it("is true only when the sanitized html still carries remote image markers", () => {
    expect(hasBlockedRemoteImages('<img data-remote-src="https://x.test/a.png">')).toBe(true);
    expect(hasBlockedRemoteImages("<p>no images</p>")).toBe(false);
    expect(hasBlockedRemoteImages(restoreRemoteImages('<img data-remote-src="https://x.test/a.png">'))).toBe(false);
  });
});

describe("buildSrcDoc", () => {
  it("wraps the body in a document with a strict default CSP that allows no remote images", () => {
    const doc = buildSrcDoc("<p>Body</p>", false);

    expect(doc).toContain("<!doctype html>");
    expect(doc).toContain('http-equiv="Content-Security-Policy"');
    expect(doc).toContain("default-src 'none'");
    expect(doc).toContain("img-src data: cid:");
    expect(doc).not.toMatch(/img-src[^;"]*https:/);
    expect(doc).toContain("style-src 'unsafe-inline'");
    expect(doc).toContain("form-action 'none'");
    expect(doc).toContain("<body>");
    expect(doc).toContain("<p>Body</p>");
  });

  it("keeps remote image markers while blocked", () => {
    const doc = buildSrcDoc('<img data-remote-src="https://x.test/a.png">', false);

    expect(doc).toContain('data-remote-src="https://x.test/a.png"');
    expect(doc).not.toMatch(/\ssrc="https:\/\/x\.test\/a\.png"/);
  });

  it("restores remote images and extends img-src to https when allowed", () => {
    const doc = buildSrcDoc('<img data-remote-src="https://x.test/a.png">', true);

    expect(doc).toContain('<img src="https://x.test/a.png">');
    expect(doc).not.toContain("data-remote-src");
    expect(doc).toContain("img-src data: cid: https:");
  });

  it("never allows scripts or same-origin content inside the document", () => {
    const doc = buildSrcDoc("<p>x</p>", true);

    expect(doc).not.toMatch(/script-src/);
    expect(doc).not.toMatch(/connect-src|frame-src|object-src 'self'/);
  });
});

describe("MailReader source contract", () => {
  it("renders the body in a sandboxed iframe with no scripts and no same-origin", () => {
    expect(existsSync("src/app/xmailx/MailReader.tsx")).toBe(true);
    const source = readFileSync("src/app/xmailx/MailReader.tsx", "utf8");

    // Links may open in a new tab, but the sandbox never grants scripts or same-origin access.
    expect(source).toContain('sandbox="allow-popups allow-popups-to-escape-sandbox"');
    expect(source).not.toContain("allow-scripts");
    expect(source).not.toContain("allow-same-origin");
    expect(source).toContain("buildSrcDoc");
  });

  it("offers the remote image banner, plain-text fallback and reply/delete actions", () => {
    const source = readFileSync("src/app/xmailx/MailReader.tsx", "utf8");

    expect(source).toContain("Remote images blocked");
    expect(source).toContain("Load images");
    expect(source).toContain("whitespace-pre-wrap");
    expect(source).toContain("Reply all");
    expect(source).toContain("onReply");
    expect(source).toContain("onChanged");
    expect(source).toContain("method: \"DELETE\"");
  });

  it("fetches the message through the admin BFF with the bearer token and marks reads from the response", () => {
    const source = readFileSync("src/app/xmailx/MailReader.tsx", "utf8");

    expect(source).toContain("/bff/admin/mail/${encodeURIComponent(account)}/messages/${uid}?folder=");
    expect(source).toContain("Authorization: `Bearer ${token}`");
    expect(source).toContain("status === 401");
    expect(source).toContain("cancelled");
  });
});
