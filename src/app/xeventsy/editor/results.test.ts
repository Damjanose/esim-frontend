import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Block } from "../eventModal";
import {
  answerLabel,
  buildResolutionBody,
  emptyResolutionInput,
  inputsFromResolution,
  parseEmails,
  type ResolutionInput
} from "./results";

const choiceBlock: Block = {
  id: "q1",
  type: "vote",
  visibleIn: ["live_unvoted"],
  props: {
    question: { default: "Who wins?" },
    questionType: "choice",
    options: [
      { id: "home", label: { default: "Home" } },
      { id: "away", label: { default: "Away" } }
    ]
  }
};

const scoreBlock: Block = {
  id: "q2",
  type: "vote",
  visibleIn: ["live_unvoted"],
  props: { question: { default: "Score?" }, questionType: "exact_score" }
};

const numberBlock: Block = {
  id: "q3",
  type: "vote",
  visibleIn: ["live_unvoted"],
  props: { question: { default: "How many?" }, questionType: "number", unit: "goals" }
};

function input(patch: Partial<ResolutionInput>): ResolutionInput {
  return { ...emptyResolutionInput(), ...patch };
}

describe("inputsFromResolution", () => {
  it("prefills each vote block's input from a saved resolution", () => {
    const inputs = inputsFromResolution([choiceBlock, scoreBlock, numberBlock], {
      q1: { optionId: "away" },
      q2: { home: 3, away: 1 },
      q3: { value: 2 }
    });
    expect(inputs.q1).toEqual({ ...emptyResolutionInput(), optionId: "away" });
    expect(inputs.q2).toEqual({ ...emptyResolutionInput(), home: "3", away: "1" });
    expect(inputs.q3).toEqual({ ...emptyResolutionInput(), value: "2" });
  });

  it("returns empty inputs when there is no resolution", () => {
    expect(inputsFromResolution([choiceBlock], null)).toEqual({ q1: emptyResolutionInput() });
  });
});

describe("parseEmails", () => {
  it("splits on lines, commas and spaces, trims, lowercases and dedupes", () => {
    expect(parseEmails("  Fan@Example.test \n\nother@example.test, fan@example.test;  ")).toEqual([
      "fan@example.test",
      "other@example.test"
    ]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseEmails("  \n  ")).toEqual([]);
  });
});

describe("answerLabel", () => {
  it("shows the option label for a choice answer", () => {
    expect(answerLabel(choiceBlock, { optionId: "away" })).toBe("Away");
  });

  it("falls back to the option id when the option is unknown", () => {
    expect(answerLabel(choiceBlock, { optionId: "draw" })).toBe("draw");
  });

  it("shows exact scores as home-away", () => {
    expect(answerLabel(scoreBlock, { home: 2, away: 1 })).toBe("2 - 1");
  });

  it("shows numbers with their unit", () => {
    expect(answerLabel(numberBlock, { value: 3 })).toBe("3 goals");
    expect(answerLabel({ ...numberBlock, props: { questionType: "number" } }, { value: 3 })).toBe("3");
  });

  it("returns a dash for a missing or malformed answer", () => {
    expect(answerLabel(choiceBlock, null)).toBe("—");
    expect(answerLabel(scoreBlock, { home: 1 })).toBe("—");
  });
});

describe("buildResolutionBody", () => {
  it("builds the resolution keyed by vote block id for valid answers", () => {
    const result = buildResolutionBody([choiceBlock, scoreBlock, numberBlock], {
      q1: input({ optionId: "home" }),
      q2: input({ home: "2", away: "0" }),
      q3: input({ value: "4.5" })
    });
    expect(result).toEqual({
      ok: true,
      body: {
        resolution: {
          q1: { optionId: "home" },
          q2: { home: 2, away: 0 },
          q3: { value: 4.5 }
        }
      }
    });
  });

  it("reports a missing choice answer", () => {
    const result = buildResolutionBody([choiceBlock], { q1: input({}) });
    expect(result.ok).toBe(false);
  });

  it("reports an exact score outside 0 to 99 or not a whole number", () => {
    expect(buildResolutionBody([scoreBlock], { q2: input({ home: "100", away: "0" }) }).ok).toBe(false);
    expect(buildResolutionBody([scoreBlock], { q2: input({ home: "1.5", away: "0" }) }).ok).toBe(false);
    expect(buildResolutionBody([scoreBlock], { q2: input({ home: "", away: "0" }) }).ok).toBe(false);
  });

  it("reports a number answer that is not a finite number", () => {
    expect(buildResolutionBody([numberBlock], { q3: input({ value: "abc" }) }).ok).toBe(false);
    expect(buildResolutionBody([numberBlock], { q3: input({ value: "" }) }).ok).toBe(false);
  });

  it("reports when there are no vote blocks", () => {
    expect(buildResolutionBody([], {})).toEqual({
      ok: false,
      message: "Add a vote block before setting a result."
    });
  });
});

describe("hidden results tab source", () => {
  const source = () => readFileSync("src/app/xeventsy/editor/ResultsTab.tsx", "utf8");

  it("exists and is a client component", () => {
    expect(existsSync("src/app/xeventsy/editor/ResultsTab.tsx")).toBe(true);
    expect(source()).toContain('"use client"');
  });

  it("calls every giveaway route through the BFF", () => {
    const text = source();
    expect(text).toContain("/entries");
    expect(text).toContain("entries-csv");
    expect(text).toContain("/disqualify");
    expect(text).toContain("/resolution");
    expect(text).toContain("/scoreboard");
    expect(text).toContain("/winners/draw");
    expect(text).toContain("/winners");
    expect(text).toContain("/resolve");
    expect(text).toContain("/winners/notify");
  });

  it("shows the account deletion warning and the notify retry note", () => {
    const text = source();
    expect(text).toContain(
      "If a winner deletes their account their winner record is deleted with it. Contact winners and deliver prizes promptly."
    );
    expect(text).toContain(
      "A winner is only marked notified when the push reached a device or the email was sent; you can retry after 30 seconds."
    );
  });

  it("notes the entries cap and never uses window.confirm or alert", () => {
    const text = source();
    expect(text).toContain("Showing the first 5000");
    expect(text).not.toContain("window.confirm");
    expect(text).not.toContain("alert(");
  });
});
