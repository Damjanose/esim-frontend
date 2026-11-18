// src/app/xeventsy/templates.test.ts
import { describe, expect, it } from "vitest";
import { draftForTemplate, parseTemplate } from "./templates";
import { hasVoteBlock, validateDraft, voteBlocksOf } from "./eventModal";

describe("parseTemplate", () => {
  it("accepts only promo and match", () => {
    expect(parseTemplate("promo")).toBe("promo");
    expect(parseTemplate("match")).toBe("match");
    expect(parseTemplate("other")).toBeNull();
    expect(parseTemplate(undefined)).toBeNull();
    expect(parseTemplate(["match", "promo"])).toBe("match");
  });
});

describe("draftForTemplate", () => {
  it("null gives the blank draft", () => {
    const draft = draftForTemplate(null);
    expect(draft.blocks).toEqual([]);
    expect(draft.title).toBe("");
  });

  it("promo is a single image block with no vote", () => {
    const draft = draftForTemplate("promo");
    expect(draft.blocks.map((b) => b.type)).toEqual(["image"]);
    expect(draft.blocks[0].visibleIn).toEqual(["live"]);
    expect(hasVoteBlock(draft.blocks)).toBe(false);
    expect(draft.frequency.mode).toBe("once");
  });

  it("match has image, heading, countdown, one exact-score vote, results, winner, rules link", () => {
    const draft = draftForTemplate("match");
    expect(draft.blocks.map((b) => b.type)).toEqual([
      "image",
      "heading",
      "countdown",
      "vote",
      "results",
      "winner",
      "rules_link"
    ]);
    const votes = voteBlocksOf(draft.blocks);
    expect(votes).toHaveLength(1);
    expect(votes[0].id).toBe("vote-1");
    expect(votes[0].props.questionType).toBe("exact_score");
    expect(votes[0].props.question).toEqual({ default: "Guess the exact score" });
    expect(votes[0].props.homeLabel).toEqual({ default: "Home" });
    expect(votes[0].props.awayLabel).toEqual({ default: "Away" });
    expect(votes[0].props.points).toBe(1);
    expect(votes[0].props).not.toHaveProperty("options");
    const results = draft.blocks.find((b) => b.type === "results")!;
    expect(results.props.voteBlockId).toBe(votes[0].id);
    const countdown = draft.blocks.find((b) => b.type === "countdown")!;
    expect(countdown.props).toEqual({ target: "votingClosesAt", size: "small" });
    expect(draft.frequency.mode).toBe("until_voted");
  });

  it("match image and heading show in every vote phase, not just live", () => {
    const draft = draftForTemplate("match");
    const image = draft.blocks.find((b) => b.type === "image")!;
    expect(image.visibleIn).toEqual([
      "live_unvoted",
      "live_voted",
      "closed_pending",
      "resolved_won",
      "resolved_lost"
    ]);
  });

  it("match passes validation once title, dates and rules are filled in", () => {
    const draft = draftForTemplate("match");
    const problems = validateDraft(draft);
    expect(problems).toEqual(
      expect.arrayContaining([
        "Title is required.",
        "Start date is required.",
        "Vote modals need a voting close date.",
        "Vote modals need rules text."
      ])
    );
    const filled = {
      ...draft,
      title: "Derby prediction",
      startsAt: "2026-11-20T10:00",
      votingClosesAt: "2026-11-25T18:00",
      displayUntil: "2026-12-01T00:00",
      rulesText: "One entry per person."
    };
    expect(validateDraft(filled)).toEqual([]);
  });

  it("returns a fresh draft each call (no shared block objects)", () => {
    const a = draftForTemplate("match");
    const b = draftForTemplate("match");
    expect(a.blocks[0]).not.toBe(b.blocks[0]);
    a.blocks[0].visibleIn.push("live");
    expect(b.blocks[0].visibleIn).not.toContain("live");
  });
});
