import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLOCKS_V2_NOTE,
  EDITOR_TABS,
  isNewModalId,
  needsBlocksV2,
  splitBackendMessage,
  visibleTabs
} from "../editor/editor";
import { newBlock } from "../eventModal";

const root = join(__dirname, "..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

describe("editor shell helpers", () => {
  it("treats only the literal id new as the create route", () => {
    expect(isNewModalId("new")).toBe(true);
    expect(isNewModalId("8f3c")).toBe(false);
    expect(isNewModalId("New")).toBe(false);
  });

  it("flags drafts that need blocks v2 (vote, results, winner, rules_link)", () => {
    expect(needsBlocksV2([newBlock("heading", [])])).toBe(false);
    expect(needsBlocksV2([newBlock("countdown", [])])).toBe(false);
    expect(needsBlocksV2([newBlock("vote", [])])).toBe(true);
    expect(needsBlocksV2([newBlock("results", [])])).toBe(true);
    expect(needsBlocksV2([newBlock("winner", [])])).toBe(true);
    expect(needsBlocksV2([newBlock("rules_link", [])])).toBe(true);
    expect(needsBlocksV2([])).toBe(false);
  });

  it("splits a backend message on '; ' into trimmed, non-empty lines", () => {
    expect(splitBackendMessage("Title is required; Start must be set ;  ")).toEqual([
      "Title is required",
      "Start must be set"
    ]);
    expect(splitBackendMessage("Voting must close before the resolution is set")).toEqual([
      "Voting must close before the resolution is set"
    ]);
    expect(splitBackendMessage("")).toEqual([]);
  });

  it("lists the five tabs in order with the Results tab only when saved and a vote block exists", () => {
    expect(EDITOR_TABS.map((tab) => tab.label)).toEqual([
      "Content",
      "Schedule",
      "Audience & frequency",
      "Giveaway rules",
      "Results"
    ]);

    expect(visibleTabs({ saved: false, hasVote: true })).not.toContain("results");
    expect(visibleTabs({ saved: true, hasVote: false })).not.toContain("results");
    expect(visibleTabs({ saved: true, hasVote: true })).toEqual([
      "content",
      "schedule",
      "audience",
      "rules",
      "results"
    ]);
    expect(visibleTabs({ saved: false, hasVote: false })).toEqual([
      "content",
      "schedule",
      "audience",
      "rules"
    ]);
  });
});

describe("editor shell source", () => {
  const page = read("[id]", "page.tsx");
  const shell = read("editor", "EditorShell.tsx");

  it("keeps the route a client page that hands the id to the shell", () => {
    expect(page.startsWith('"use client"')).toBe(true);
    expect(page).toContain("EditorShell");
    expect(page).toContain("params");
  });

  it("imports every tab component and the shared helpers", () => {
    expect(shell).toContain('from "./BlocksTab"');
    expect(shell).toContain('from "./PreviewPanel"');
    expect(shell).toContain('from "./ScheduleTab"');
    expect(shell).toContain('from "./AudienceFrequencyTab"');
    expect(shell).toContain('from "./RulesTab"');
    expect(shell).not.toContain("TranslationsTab");
    expect(shell).toContain('from "./ResultsTab"');
    expect(shell).toContain("adminFetch");
    expect(shell).toContain("draftFromRecord");
    expect(shell).toContain("draftToRequestBody");
    expect(shell).toContain("validateDraft");
  });

  it("calls the create, update, publish, duplicate and archive routes", () => {
    expect(shell).toContain('method: "POST"');
    expect(shell).toContain('method: "PUT"');
    expect(shell).toContain("/publish");
    expect(shell).toContain("/duplicate");
    expect(shell).toContain("/archive");
    expect(shell).toContain("router.replace(`/xeventsy/${");
  });

  it("uses inline confirms, never window.confirm or alert", () => {
    expect(shell).not.toContain("window.confirm");
    expect(shell).not.toContain("alert(");
  });

  it("passes the saved resolution to the Results tab and shows the blocks v2 note", () => {
    expect(shell).toContain("resolution={record.resolution}");
    expect(shell).toContain("BLOCKS_V2_NOTE");
    expect(BLOCKS_V2_NOTE).toContain("app version supporting blocks v2");
  });

  it("tracks unsaved edits and feeds the live preview the draft", () => {
    expect(shell).toContain("setDirty(true)");
    expect(shell).toContain("<PreviewPanel draft={draft}");
  });

  it("uses the admin session and the shared admin shell", () => {
    expect(shell).toContain("useAdminSession");
    expect(shell).toContain("AdminNav");
    expect(shell).toContain("AdminLoginCard");
    expect(shell).toContain("handleUnauthorized");
  });
});

describe("editor shell review fixes", () => {
  const shell = () => read("editor", "EditorShell.tsx");
  it("Results tab works on the saved blocks, not the unsaved draft", () => {
    expect(shell()).toContain("voteBlocksOf(record?.blocks ?? [])");
  });
  it("navigates to a new modal only after save and publish finish", () => {
    const src = shell();
    expect(src).toContain("goToCreated");
    expect(src.match(/router\.replace/g)?.length).toBe(1);
  });
  it("keeps the unsaved flag when the draft changed during a save", () => {
    expect(shell()).toContain("draftRef.current !== snapshot");
  });
});
