import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { emptyDraft, newBlock, type Block, type EditorDraft } from "../eventModal";
import { ScheduleTab } from "./ScheduleTab";
import { AudienceFrequencyTab, FREQUENCY_MODES } from "./AudienceFrequencyTab";
import { RulesTab } from "./RulesTab";
import { BlockInspector } from "./BlockInspector";
import { resultsHref } from "./editor";

describe("resultsHref", () => {
  it("points at the standalone results page and encodes the id", () => {
    expect(resultsHref("abc123")).toBe("/xeventsy/abc123/results");
    expect(resultsHref("a/b")).toBe("/xeventsy/a%2Fb/results");
  });
});

function withDraft(patch: Partial<EditorDraft> = {}): EditorDraft {
  return { ...emptyDraft(), ...patch };
}

function tabProps(draft: EditorDraft) {
  return { draft, onChange: vi.fn() };
}

describe("ScheduleTab", () => {
  it("renders datetime-local inputs for start, show-until and voting close", () => {
    const markup = renderToStaticMarkup(createElement(ScheduleTab, tabProps(withDraft())));

    expect(markup).toContain('type="datetime-local"');
    expect(markup).toContain("Starts");
    expect(markup).toContain("Show until");
    expect(markup).toContain("Voting closes (match kickoff)");
  });

  it("states the local time zone the admin is editing in", () => {
    const markup = renderToStaticMarkup(createElement(ScheduleTab, tabProps(withDraft())));

    expect(markup).toContain("Times are in your local time zone:");
    expect(markup).toContain(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it("shows the UTC equivalent under a set input", () => {
    const markup = renderToStaticMarkup(
      createElement(ScheduleTab, tabProps(withDraft({ startsAt: "2026-12-01T18:00" })))
    );

    expect(markup).toContain("UTC");
  });

  it("explains that Show until keeps the modal up after voting closes", () => {
    const markup = renderToStaticMarkup(createElement(ScheduleTab, tabProps(withDraft())));

    expect(markup).toContain("keeps showing after voting closes");
  });
});

describe("AudienceFrequencyTab", () => {
  it("offers exactly the six frequency modes", () => {
    expect(FREQUENCY_MODES.map((mode) => mode.value)).toEqual([
      "once",
      "daily",
      "every_n_opens",
      "every_n_hours",
      "until_dismissed",
      "until_voted"
    ]);
    for (const mode of FREQUENCY_MODES) {
      expect(mode.description.length).toBeGreaterThan(0);
    }
  });

  it("renders every mode as a select option", () => {
    const markup = renderToStaticMarkup(
      createElement(AudienceFrequencyTab, tabProps(withDraft()))
    );

    for (const mode of FREQUENCY_MODES) {
      expect(markup).toContain(`value="${mode.value}"`);
    }
  });

  it("shows the n input only for every_n_hours and every_n_opens", () => {
    const hours = renderToStaticMarkup(
      createElement(
        AudienceFrequencyTab,
        tabProps(withDraft({ frequency: { mode: "every_n_hours", n: "", maxImpressions: "" } }))
      )
    );
    const opens = renderToStaticMarkup(
      createElement(
        AudienceFrequencyTab,
        tabProps(withDraft({ frequency: { mode: "every_n_opens", n: "", maxImpressions: "" } }))
      )
    );
    const daily = renderToStaticMarkup(
      createElement(
        AudienceFrequencyTab,
        tabProps(withDraft({ frequency: { mode: "daily", n: "", maxImpressions: "" } }))
      )
    );

    expect(hours).toContain('id="frequency-n"');
    expect(opens).toContain('id="frequency-n"');
    expect(daily).not.toContain('id="frequency-n"');
  });

  it("renders platform and locale controls and no presentation choice", () => {
    const markup = renderToStaticMarkup(
      createElement(AudienceFrequencyTab, tabProps(withDraft()))
    );

    expect(markup).toContain("iOS");
    expect(markup).toContain("Android");
    expect(markup).toContain("empty = all languages");
    expect(markup).not.toContain("Bottom sheet");
    expect(markup).not.toContain("Centered modal");
  });
});

describe("RulesTab", () => {
  it("states the Apple disclaimer the app adds to the giveaway", () => {
    const markup = renderToStaticMarkup(createElement(RulesTab, tabProps(withDraft())));

    expect(markup).toContain("Apple is not a sponsor of or involved in this giveaway");
  });

  it("offers the two winner visibility options", () => {
    const markup = renderToStaticMarkup(createElement(RulesTab, tabProps(withDraft())));

    expect(markup).toContain("Public (masked names)");
    expect(markup).toContain("Only the winner");
  });

  it("shows a character counter capped at 10000", () => {
    const markup = renderToStaticMarkup(createElement(RulesTab, tabProps(withDraft())));

    expect(markup).toContain("0 / 10000");
  });

  it("hints to add a vote block when the draft has none", () => {
    const markup = renderToStaticMarkup(createElement(RulesTab, tabProps(withDraft())));

    expect(markup).toContain("Add a vote block in Content");
  });

  it("drops the hint once a vote block exists", () => {
    const vote = newBlock("vote", []);
    const markup = renderToStaticMarkup(
      createElement(RulesTab, tabProps(withDraft({ blocks: [vote] })))
    );

    expect(markup).not.toContain("Add a vote block in Content");
  });
});

describe("editor tab sources", () => {
  it("ScheduleTab reads the local time zone from Intl", () => {
    const source = readFileSync("src/app/xeventsy/editor/ScheduleTab.tsx", "utf8");

    expect(source).toContain("Intl.DateTimeFormat().resolvedOptions().timeZone");
  });

  it("tabs report edits through onChange patches, never mutating the draft", () => {
    for (const file of [
      "src/app/xeventsy/editor/ScheduleTab.tsx",
      "src/app/xeventsy/editor/AudienceFrequencyTab.tsx",
      "src/app/xeventsy/editor/RulesTab.tsx"
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("onChange(");
      expect(source).not.toContain("draft.blocks.push");
    }
  });
});

describe("BlockInspector countdown size", () => {
  const renderCountdown = (props: Record<string, unknown>) => {
    const block: Block = { ...newBlock("countdown", []), props };
    return renderToStaticMarkup(
      createElement(BlockInspector, {
        block,
        voteBlocks: [],
        token: "test-token",
        onUnauthorized: () => {},
        onPatch: () => {}
      })
    );
  };

  it("offers a Size select with small and large options", () => {
    const html = renderCountdown({ target: "displayUntil", size: "small" });

    expect(html).toContain(">Size<");
    expect(html).toContain('<option value="small" selected="">Small, compact pill</option>');
    expect(html).toContain('<option value="large">Large tiles</option>');
  });

  it("treats a missing size as small", () => {
    const html = renderCountdown({ target: "displayUntil" });

    expect(html).toContain('<option value="small" selected="">Small, compact pill</option>');
  });
});
