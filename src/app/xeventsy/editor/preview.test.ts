import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "../eventModal";
import { describeAction, formatRemaining, percentWidth } from "./preview";

describe("formatRemaining", () => {
  const now = Date.parse("2026-11-18T08:00:00.000Z");

  it("formats the time left as days, hours and minutes", () => {
    const target = new Date(now + (2 * 24 * 60 + 3 * 60 + 15) * 60_000).toISOString();
    expect(formatRemaining(target, now)).toBe("2d 3h 15m");
  });

  it("clamps a target in the past to zero", () => {
    const target = new Date(now - 5 * 60_000).toISOString();
    expect(formatRemaining(target, now)).toBe("0d 0h 0m");
  });

  it("returns an empty string for an unparseable target", () => {
    expect(formatRemaining("not-a-date", now)).toBe("");
  });
});

describe("percentWidth", () => {
  it("returns a CSS width string clamped to 0 to 100", () => {
    expect(percentWidth(42)).toBe("42%");
    expect(percentWidth(-5)).toBe("0%");
    expect(percentWidth(150)).toBe("100%");
    expect(percentWidth(Number.NaN)).toBe("0%");
  });
});

describe("describeAction", () => {
  it("describes each button action in one line", () => {
    expect(describeAction({ type: "dismiss" })).toBe("Closes the modal");
    expect(describeAction({ type: "url", url: "https://example.test/offer" })).toBe(
      "https://example.test/offer"
    );
    expect(describeAction({ type: "route", route: "/games" })).toBe("/games");
    expect(describeAction({ type: "route", route: "/country/[slug]", slug: "albania" })).toBe(
      "/country/albania"
    );
  });

  it("returns an empty string for an unknown or missing action", () => {
    expect(describeAction(undefined)).toBe("");
    expect(describeAction({ type: "teleport" })).toBe("");
  });
});

describe("PhonePreview", () => {
  it("exists and handles every block type", () => {
    expect(existsSync("src/app/xeventsy/editor/PhonePreview.tsx")).toBe(true);
    const source = readFileSync("src/app/xeventsy/editor/PhonePreview.tsx", "utf8");

    for (const type of BLOCK_TYPES) {
      expect(source).toContain(`"${type}"`);
    }
    expect(source).toContain("Unsupported block");
    expect(source).toContain("rulesText");
    expect(source).toContain("formatRemaining");
  });

  it("resolves image blocks through the BFF image route or an https url", () => {
    const source = readFileSync("src/app/xeventsy/editor/PhonePreview.tsx", "utf8");
    expect(source).toContain("/bff/admin/event-modals/images/");
    expect(source).toContain("imageId");
  });
});

describe("PreviewPanel", () => {
  it("exists and fetches the preview through adminFetch with the phase and locale", () => {
    expect(existsSync("src/app/xeventsy/editor/PreviewPanel.tsx")).toBe(true);
    const source = readFileSync("src/app/xeventsy/editor/PreviewPanel.tsx", "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("adminFetch");
    expect(source).toContain("/preview-draft");
    expect(source).toContain('method: "POST"');
    expect(source).toContain("phase");
    expect(source).toContain("locale");
    expect(source).toContain("LOCALES");
    expect(source).toContain("PHASE_LABELS");
    expect(source).toContain("onUnauthorized");
  });

  it("shows the paused and no-blocks messages", () => {
    const source = readFileSync("src/app/xeventsy/editor/PreviewPanel.tsx", "utf8");
    expect(source).toContain("Preview paused");
    expect(source).toContain("No blocks are visible in this phase");
  });

  it("renders the payload through PhonePreview", () => {
    const source = readFileSync("src/app/xeventsy/editor/PreviewPanel.tsx", "utf8");
    expect(source).toContain("PhonePreview");
    expect(source).toContain("payload");
  });
});

describe("buildDraftPreviewBody", () => {
  it("wraps the unsaved draft with phase and locale and drops title, start and audience", async () => {
    const { buildDraftPreviewBody } = await import("./preview");
    const { emptyDraft } = await import("../eventModal");
    const draft = { ...emptyDraft(), title: "Secret", rulesText: " Rules " };
    const body = buildDraftPreviewBody(draft, "live_voted", "de") as { draft: Record<string, unknown>; phase: string; locale: string };
    expect(body.phase).toBe("live_voted");
    expect(body.locale).toBe("de");
    expect(body.draft.rulesText).toBe("Rules");
    expect(body.draft).not.toHaveProperty("title");
    expect(body.draft).not.toHaveProperty("startsAt");
    expect(body.draft).not.toHaveProperty("audience");
    expect(body.draft).toHaveProperty("blocks");
  });
});

describe("live preview wiring", () => {
  it("PreviewPanel posts the draft to /preview-draft and the editor has no manual translations tab", async () => {
    const { readFileSync, existsSync } = await import("node:fs");
    const panel = readFileSync("src/app/xeventsy/editor/PreviewPanel.tsx", "utf8");
    expect(panel).toContain('"/preview-draft"');
    expect(panel).toContain("PREVIEW_DEBOUNCE_MS");
    expect(readFileSync("src/app/xeventsy/editor/editor.ts", "utf8")).not.toContain("translations");
    expect(existsSync("src/app/xeventsy/editor/TranslationsTab.tsx")).toBe(false);
    expect(existsSync("src/app/bff/admin/event-modals/preview-draft/route.ts")).toBe(true);
  });
});
