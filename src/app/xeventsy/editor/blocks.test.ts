import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, type Block, type Phase } from "../eventModal";
import {
  buttonActionFor,
  buttonActionKind,
  filterCopyCode,
  GIVEAWAY_BLOCK_TYPES,
  imageWithId,
  imageWithUrl,
  isValidCopyCode,
  isValidOptionId,
  nextOptionId,
  optionIdProblems,
  summarizeBlock,
  togglePhase,
  withTextProp
} from "./blocks";

function block(partial: Partial<Block> & Pick<Block, "id" | "type">): Block {
  return { props: {}, visibleIn: ["live"], ...partial };
}

describe("summarizeBlock", () => {
  it("shows the text of text-like blocks", () => {
    expect(summarizeBlock(block({ id: "h", type: "heading", props: { text: { default: "Summer sale" } } }))).toBe(
      "Summer sale"
    );
    expect(summarizeBlock(block({ id: "t", type: "text", props: { text: "Body copy" } }))).toBe("Body copy");
  });

  it("shows the label, question, code and targets of the other blocks", () => {
    expect(summarizeBlock(block({ id: "b", type: "button", props: { label: { default: "Browse" } } }))).toBe("Browse");
    expect(summarizeBlock(block({ id: "v", type: "vote", props: { question: { default: "Who wins?" } } }))).toBe(
      "Who wins?"
    );
    expect(summarizeBlock(block({ id: "c", type: "copy_code", props: { code: "SAVE10" } }))).toBe("SAVE10");
    expect(summarizeBlock(block({ id: "cd", type: "countdown", props: { target: "votingClosesAt" } }))).toBe(
      "Ends when voting closes"
    );
    expect(summarizeBlock(block({ id: "cd2", type: "countdown", props: { target: "displayUntil" } }))).toBe(
      "Ends with the display window"
    );
    expect(summarizeBlock(block({ id: "r", type: "results", props: { voteBlockId: "v" } }))).toBe("Results of v");
    expect(summarizeBlock(block({ id: "w", type: "winner", props: { title: { default: "You won!" } } }))).toBe(
      "You won!"
    );
    expect(summarizeBlock(block({ id: "d", type: "divider" }))).toBe("Divider");
    expect(summarizeBlock(block({ id: "rl", type: "rules_link" }))).toBe("Rules link");
  });

  it("describes images by their source and falls back when text is empty", () => {
    expect(summarizeBlock(block({ id: "i", type: "image", props: { imageId: "abc" } }))).toBe("Uploaded image");
    expect(summarizeBlock(block({ id: "i2", type: "image", props: { url: "https://cdn.example.test/a.png" } }))).toBe(
      "Image from URL"
    );
    expect(summarizeBlock(block({ id: "i3", type: "image", props: {} }))).toBe("No image yet");
    expect(summarizeBlock(block({ id: "h2", type: "heading", props: { text: { default: "" } } }))).toBe("No text yet");
  });
});

describe("option ids", () => {
  it("accepts 1 to 40 chars of letters, digits, underscore and dash", () => {
    expect(isValidOptionId("team_a")).toBe(true);
    expect(isValidOptionId("home-1")).toBe(true);
    expect(isValidOptionId("a".repeat(40))).toBe(true);
    expect(isValidOptionId("")).toBe(false);
    expect(isValidOptionId("a".repeat(41))).toBe(false);
    expect(isValidOptionId("team a")).toBe(false);
    expect(isValidOptionId("é")).toBe(false);
  });

  it("reports a count outside 2 to 10, duplicate ids and invalid ids", () => {
    const opt = (id: string) => ({ id, label: { default: id } });
    expect(optionIdProblems([opt("a"), opt("b")])).toEqual([]);
    expect(optionIdProblems([opt("a")])).toContain("A choice vote needs at least 2 options.");
    expect(optionIdProblems(Array.from({ length: 11 }, (_, i) => opt(`o${i}`)))).toContain(
      "A choice vote can have at most 10 options."
    );
    expect(optionIdProblems([opt("a"), opt("a")])).toContain("Option ids must be unique.");
    expect(optionIdProblems([opt("a"), opt("b c")])).toContain(
      "Option ids use letters, digits, - and _ only (up to 40 characters)."
    );
  });

  it("creates the next free option id", () => {
    expect(nextOptionId([{ id: "option-1" }, { id: "option-2" }])).toBe("option-3");
    expect(nextOptionId([{ id: "home" }])).toBe("option-1");
  });
});

describe("copy code", () => {
  it("accepts 1 to 40 chars of letters, digits, underscore and dash", () => {
    expect(isValidCopyCode("SAVE_10-OFF")).toBe(true);
    expect(isValidCopyCode("")).toBe(false);
    expect(isValidCopyCode("SAVE 10")).toBe(false);
  });

  it("strips characters the API does not allow while typing", () => {
    expect(filterCopyCode("SAVE 10!%")).toBe("SAVE10");
    expect(filterCopyCode("ok-_9")).toBe("ok-_9");
  });
});

describe("image source", () => {
  it("imageWithId sets imageId and drops url", () => {
    expect(imageWithId({ url: "https://cdn.example.test/a.png", alt: { default: "A" } }, "img1")).toEqual({
      imageId: "img1",
      alt: { default: "A" }
    });
  });

  it("imageWithUrl sets url and drops imageId", () => {
    expect(imageWithUrl({ imageId: "img1", alt: { default: "A" } }, "https://cdn.example.test/a.png")).toEqual({
      url: "https://cdn.example.test/a.png",
      alt: { default: "A" }
    });
  });
});

describe("withTextProp", () => {
  it("stores text as a TextValue and keeps translations", () => {
    const props = { label: { default: "Old", translations: { de: "Alt" } } };
    expect(withTextProp(props, "label", "New")).toEqual({ label: { default: "New", translations: { de: "Alt" } } });
  });

  it("removes an optional prop when its text is cleared", () => {
    expect(withTextProp({ label: { default: "Old" }, code: "X" }, "label", "  ", { optional: true })).toEqual({
      code: "X"
    });
  });

  it("keeps a required prop even when the text is empty", () => {
    expect(withTextProp({ text: { default: "Old" } }, "text", "")).toEqual({ text: { default: "" } });
  });
});

describe("button actions", () => {
  it("builds dismiss, url and route actions", () => {
    expect(buttonActionFor("dismiss", {})).toEqual({ type: "dismiss" });
    expect(buttonActionFor("url", { url: "https://example.test/x" })).toEqual({
      type: "url",
      url: "https://example.test/x"
    });
    expect(buttonActionFor("route", { route: "/games" })).toEqual({ type: "route", route: "/games" });
    expect(buttonActionFor("route", { route: "/country/[slug]", slug: "albania" })).toEqual({
      type: "route",
      route: "/country/[slug]",
      slug: "albania"
    });
  });

  it("reads the kind back from a stored action", () => {
    expect(buttonActionKind({ type: "url", url: "https://example.test" })).toBe("url");
    expect(buttonActionKind({ type: "route", route: "/games" })).toBe("route");
    expect(buttonActionKind({ type: "dismiss" })).toBe("dismiss");
    expect(buttonActionKind(undefined)).toBe("dismiss");
  });
});

describe("visibility and block groups", () => {
  it("toggles a phase and keeps the phase order", () => {
    const start: Phase[] = ["resolved_won"];
    expect(togglePhase(start, "live")).toEqual(["live", "resolved_won"]);
    expect(togglePhase(["live", "resolved_won"], "live")).toEqual(["resolved_won"]);
  });

  it("marks vote, results and winner as giveaway blocks", () => {
    expect([...GIVEAWAY_BLOCK_TYPES].sort()).toEqual(["results", "vote", "winner"]);
  });
});

describe("BlocksTab and BlockInspector source", () => {
  const tabPath = "src/app/xeventsy/editor/BlocksTab.tsx";
  const inspectorPath = "src/app/xeventsy/editor/BlockInspector.tsx";

  it("exists", () => {
    expect(existsSync(tabPath)).toBe(true);
    expect(existsSync(inspectorPath)).toBe(true);
  });

  it("has accessible up and down buttons, a delete confirm and an add menu", () => {
    const source = readFileSync(tabPath, "utf8");
    expect(source).toContain('aria-label="Move up"');
    expect(source).toContain('aria-label="Move down"');
    expect(source).toContain("Add block");
    expect(source).toContain("BLOCK_TYPES");
    expect(source).toContain("needs app 2+");
    expect(source).not.toMatch(/window\.(confirm|alert)/);
  });

  it("uploads images through adminUpload and previews them via the BFF route", () => {
    const source = readFileSync(tabPath, "utf8") + readFileSync(inspectorPath, "utf8");
    expect(source).toContain("adminUpload");
    expect(source).toContain("/bff/admin/event-modals/images/");
  });

  it("has an inspector case for every block type", () => {
    const source = readFileSync(inspectorPath, "utf8");
    for (const type of BLOCK_TYPES) {
      expect(source).toContain(`case "${type}"`);
    }
  });

  it("has a Visible in checklist that uses the phase labels", () => {
    const source = readFileSync(inspectorPath, "utf8");
    expect(source).toContain("Visible in");
    expect(source).toContain("PHASE_LABELS");
    expect(source).toContain("togglePhase");
    expect(readFileSync(tabPath, "utf8")).toContain("updateBlock");
  });
});
