import { describe, expect, it } from "vitest";
import {
  BLOCK_DEFS,
  BLOCK_TYPES,
  LOCALES,
  PHASE_LABELS,
  PHASES,
  ROUTE_OPTIONS,
  applyTextField,
  collectTextFields,
  draftFromRecord,
  draftToRequestBody,
  emptyDraft,
  fromLocalInput,
  hasVoteBlock,
  moveBlock,
  newBlock,
  removeBlock,
  setTextDefault,
  setTranslation,
  textOf,
  toLocalInput,
  updateBlock,
  validateDraft,
  voteBlocksOf,
  type Block,
  type EditorDraft,
  type EventModalRecord
} from "./eventModal";

// Timezone-independent: every expected instant is built with the local Date
// constructor, so the assertions hold in any TZ the test runner uses.
function localInput(y: number, m: number, d: number, h: number, min: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}
function localIso(y: number, m: number, d: number, h: number, min: number) {
  return new Date(y, m - 1, d, h, min).toISOString();
}

function validDraft(overrides: Partial<EditorDraft> = {}): EditorDraft {
  return {
    ...emptyDraft(),
    title: "Summer sale",
    startsAt: localInput(2026, 12, 1, 10, 0),
    displayUntil: localInput(2026, 12, 10, 10, 0),
    blocks: [newBlock("heading", [])],
    ...overrides
  };
}

function record(overrides: Partial<EventModalRecord> = {}): EventModalRecord {
  return {
    id: "m1",
    title: "Summer sale",
    status: "published",
    timeState: "live",
    stats: { shown: 0, dismissed: 0, cta_clicked: 0 },
    startsAt: localIso(2026, 12, 1, 10, 0),
    votingClosesAt: null,
    displayUntil: localIso(2026, 12, 10, 10, 0),
    resultsAt: null,
    priority: 3,
    presentation: "modal",
    audience: { platforms: ["ios"], locales: ["en", "de"] },
    frequency: { mode: "every_n_opens", n: 3 },
    requiredSchemaVersion: 1,
    blocks: [],
    rulesText: null,
    winnerVisibility: "winner_only",
    resolution: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides
  };
}

describe("constants", () => {
  it("lists the six phases in API order with labels", () => {
    expect(PHASES).toEqual([
      "live",
      "live_unvoted",
      "live_voted",
      "closed_pending",
      "resolved_won",
      "resolved_lost"
    ]);
    expect(PHASE_LABELS.live).toBe("Promo (live)");
    expect(PHASE_LABELS.resolved_lost).toBe("Resolved, you lost");
  });

  it("lists the eleven block types", () => {
    expect(BLOCK_TYPES).toEqual([
      "image",
      "heading",
      "text",
      "countdown",
      "button",
      "copy_code",
      "divider",
      "vote",
      "results",
      "winner",
      "rules_link"
    ]);
  });

  it("mirrors the backend default visibleIn per block type", () => {
    expect(BLOCK_DEFS.heading.defaultVisibleIn).toEqual(["live"]);
    expect(BLOCK_DEFS.text.defaultVisibleIn).toEqual(["live"]);
    expect(BLOCK_DEFS.divider.defaultVisibleIn).toEqual(["live"]);
    expect(BLOCK_DEFS.image.defaultVisibleIn).toEqual(["live"]);
    expect(BLOCK_DEFS.countdown.defaultVisibleIn).toEqual(["live"]);
    expect(BLOCK_DEFS.button.defaultVisibleIn).toEqual(["live"]);
    expect(BLOCK_DEFS.copy_code.defaultVisibleIn).toEqual(["live"]);
    expect(BLOCK_DEFS.vote.defaultVisibleIn).toEqual(["live_unvoted"]);
    expect(BLOCK_DEFS.results.defaultVisibleIn).toEqual([
      "live_voted",
      "closed_pending",
      "resolved_won",
      "resolved_lost"
    ]);
    expect(BLOCK_DEFS.winner.defaultVisibleIn).toEqual(["resolved_won"]);
    expect(BLOCK_DEFS.rules_link.defaultVisibleIn).toEqual(["live_unvoted", "live_voted"]);
  });

  it("has the default props from the plan and marks only vote as a vote type", () => {
    expect(BLOCK_DEFS.heading.createProps()).toEqual({ text: { default: "" } });
    expect(BLOCK_DEFS.text.createProps()).toEqual({ text: { default: "" } });
    expect(BLOCK_DEFS.image.createProps()).toEqual({ alt: { default: "" } });
    expect(BLOCK_DEFS.countdown.createProps()).toEqual({ target: "displayUntil", size: "small" });
    expect(BLOCK_DEFS.button.createProps()).toEqual({
      label: { default: "Open" },
      action: { type: "dismiss" },
      style: "primary"
    });
    expect(BLOCK_DEFS.copy_code.createProps()).toEqual({ code: "" });
    expect(BLOCK_DEFS.divider.createProps()).toEqual({});
    expect(BLOCK_DEFS.vote.createProps()).toEqual({
      question: { default: "" },
      questionType: "choice",
      options: [
        { id: "home", label: { default: "Home" } },
        { id: "away", label: { default: "Away" } }
      ],
      points: 1
    });
    expect(BLOCK_DEFS.results.createProps()).toEqual({ voteBlockId: "" });
    expect(BLOCK_DEFS.winner.createProps()).toEqual({ title: { default: "You won!" } });
    expect(BLOCK_DEFS.rules_link.createProps()).toEqual({});

    for (const type of BLOCK_TYPES) {
      expect(typeof BLOCK_DEFS[type].label).toBe("string");
      expect(typeof BLOCK_DEFS[type].icon).toBe("string");
      expect(BLOCK_DEFS[type].isVoteType ?? false).toBe(type === "vote");
    }
  });

  it("returns fresh createProps objects on every call", () => {
    const first = BLOCK_DEFS.vote.createProps();
    const second = BLOCK_DEFS.vote.createProps();
    expect(first).not.toBe(second);
    expect(first.options).not.toBe(second.options);
  });

  it("lists the twelve allowed routes and marks the country page as needing a slug", () => {
    expect(ROUTE_OPTIONS).toHaveLength(12);
    expect(ROUTE_OPTIONS.map((option) => option.value)).toContain("/(tabs)/marketplace");
    expect(ROUTE_OPTIONS.find((option) => option.value === "/country/[slug]")?.needsSlug).toBe(
      true
    );
    expect(ROUTE_OPTIONS.filter((option) => option.needsSlug)).toHaveLength(1);
  });

  it("lists the ten app locales", () => {
    expect(LOCALES.map((locale) => locale.code)).toEqual([
      "en",
      "ar",
      "fr",
      "es",
      "de",
      "pt",
      "tr",
      "sq",
      "it",
      "el"
    ]);
    for (const locale of LOCALES) expect(locale.label.length).toBeGreaterThan(0);
  });
});

describe("draft mapping", () => {
  it("emptyDraft starts blank with the centered presentation and default visibility", () => {
    expect(emptyDraft()).toEqual({
      title: "",
      priority: 0,
      presentation: "modal",
      startsAt: "",
      votingClosesAt: "",
      displayUntil: "",
      audience: { platforms: [], locales: "" },
      frequency: { mode: "once", n: "", maxImpressions: "" },
      rulesText: "",
      winnerVisibility: "public",
      blocks: []
    });
  });

  it("draftFromRecord maps dates to local input, locales to a comma list and frequency to strings", () => {
    const draft = draftFromRecord(record());

    expect(draft.title).toBe("Summer sale");
    expect(draft.priority).toBe(3);
    expect(draft.presentation).toBe("modal");
    expect(draft.startsAt).toBe(localInput(2026, 12, 1, 10, 0));
    expect(draft.votingClosesAt).toBe("");
    expect(draft.displayUntil).toBe(localInput(2026, 12, 10, 10, 0));
    expect(draft.audience).toEqual({ platforms: ["ios"], locales: "en, de" });
    expect(draft.frequency).toEqual({ mode: "every_n_opens", n: "3", maxImpressions: "" });
    expect(draft.rulesText).toBe("");
    expect(draft.winnerVisibility).toBe("winner_only");
    expect(draft.blocks).toEqual([]);
    expect(draft).not.toHaveProperty("id");
  });

  it("draftFromRecord defaults missing audience and frequency values", () => {
    const draft = draftFromRecord(
      record({ audience: {}, frequency: { mode: "daily", maxImpressions: 2 }, rulesText: "Rules" })
    );
    expect(draft.audience).toEqual({ platforms: [], locales: "" });
    expect(draft.frequency).toEqual({ mode: "daily", n: "", maxImpressions: "2" });
    expect(draft.rulesText).toBe("Rules");
  });

  it("draftToRequestBody always asks for the centered modal, even for an old sheet record", () => {
    const draft = validDraft({ presentation: "sheet", blocks: [] });
    expect(draftToRequestBody(draft).presentation).toBe("modal");
  });

  it("draftToRequestBody golden case with all fields set", () => {
    const draft = validDraft({
      title: "  Summer  ",
      priority: 5,
      presentation: "modal",
      displayUntil: localInput(2026, 12, 1, 0, 0),
      startsAt: localInput(2026, 11, 20, 10, 0),
      audience: { platforms: ["ios"], locales: " EN, de-AT ,, " },
      frequency: { mode: "every_n_hours", n: "6", maxImpressions: "3" },
      rulesText: "  ",
      winnerVisibility: "public",
      blocks: []
    });

    expect(draftToRequestBody(draft)).toEqual({
      title: "Summer",
      priority: 5,
      presentation: "modal",
      startsAt: localIso(2026, 11, 20, 10, 0),
      votingClosesAt: null,
      displayUntil: localIso(2026, 12, 1, 0, 0),
      audience: { platforms: ["ios"], locales: ["en", "de-at"] },
      frequency: { mode: "every_n_hours", n: 6, maxImpressions: 3 },
      rulesText: null,
      winnerVisibility: "public",
      blocks: []
    });
  });

  it("draftToRequestBody drops n for modes that do not use it and omits empty maxImpressions", () => {
    const body = draftToRequestBody(
      validDraft({
        audience: { platforms: [], locales: "" },
        frequency: { mode: "daily", n: "5", maxImpressions: "" },
        rulesText: "Rules text"
      })
    );
    expect(body.frequency).toEqual({ mode: "daily" });
    expect(body.audience).toEqual({});
    expect(body.rulesText).toBe("Rules text");
  });

  it("draftToRequestBody keeps n for every_n_opens and drops a blank n", () => {
    const withN = draftToRequestBody(
      validDraft({ frequency: { mode: "every_n_opens", n: "2", maxImpressions: "" } })
    );
    expect(withN.frequency).toEqual({ mode: "every_n_opens", n: 2 });

    const blankN = draftToRequestBody(
      validDraft({ frequency: { mode: "every_n_opens", n: "", maxImpressions: "" } })
    );
    expect(blankN.frequency).toEqual({ mode: "every_n_opens" });
  });

  it("draftFromRecord and draftToRequestBody round-trip the start date at minute precision", () => {
    const iso = localIso(2026, 12, 1, 10, 30);
    const body = draftToRequestBody(draftFromRecord(record({ startsAt: iso })));
    expect(body.startsAt).toBe(iso);
  });
});

describe("local datetime helpers", () => {
  it("toLocalInput formats the browser's local time as YYYY-MM-DDTHH:mm", () => {
    expect(toLocalInput(localIso(2026, 12, 1, 9, 5))).toBe("2026-12-01T09:05");
  });

  it("toLocalInput returns an empty string for null or invalid input", () => {
    expect(toLocalInput(null)).toBe("");
    expect(toLocalInput("not-a-date")).toBe("");
  });

  it("fromLocalInput returns the UTC ISO string for a local datetime", () => {
    expect(fromLocalInput("2026-12-01T10:30")).toBe(localIso(2026, 12, 1, 10, 30));
  });

  it("fromLocalInput returns null for empty or invalid input", () => {
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("garbage")).toBeNull();
  });

  it("round-trips an ISO instant through toLocalInput and fromLocalInput", () => {
    const iso = localIso(2027, 3, 14, 23, 59);
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });
});

describe("block helpers", () => {
  it("newBlock creates a unique id, the default props and the default visibleIn", () => {
    const block = newBlock("vote", []);
    expect(block.id).toBe("vote-1");
    expect(block.type).toBe("vote");
    expect(block.props).toEqual(BLOCK_DEFS.vote.createProps());
    expect(block.visibleIn).toEqual(["live_unvoted"]);
    expect(block.visibleIn).not.toBe(BLOCK_DEFS.vote.defaultVisibleIn);
  });

  it("newBlock skips ids that already exist", () => {
    expect(newBlock("heading", ["heading-1"]).id).toBe("heading-2");
    expect(newBlock("heading", ["heading-1", "heading-2"]).id).toBe("heading-3");
    expect(newBlock("copy_code", []).id).toBe("copy_code-1");
  });

  it("moveBlock swaps neighbours and is a no-op at the ends", () => {
    const blocks: Block[] = [
      newBlock("heading", []),
      newBlock("divider", ["heading-1"]),
      newBlock("button", ["heading-1", "divider-1"])
    ];
    const ids = (list: Block[]) => list.map((block) => block.id);

    const down = moveBlock(blocks, 0, 1);
    expect(ids(down)).toEqual(["divider-1", "heading-1", "button-1"]);
    expect(ids(blocks)).toEqual(["heading-1", "divider-1", "button-1"]);

    const up = moveBlock(blocks, 2, -1);
    expect(ids(up)).toEqual(["heading-1", "button-1", "divider-1"]);

    const topUp = moveBlock(blocks, 0, -1);
    expect(ids(topUp)).toEqual(ids(blocks));
    expect(topUp).not.toBe(blocks);

    const bottomDown = moveBlock(blocks, 2, 1);
    expect(ids(bottomDown)).toEqual(ids(blocks));
    expect(bottomDown).not.toBe(blocks);
  });

  it("removeBlock drops only the matching block", () => {
    const blocks = [newBlock("heading", []), newBlock("divider", ["heading-1"])];
    expect(removeBlock(blocks, "heading-1").map((block) => block.id)).toEqual(["divider-1"]);
    expect(blocks).toHaveLength(2);
  });

  it("updateBlock patches props or visibleIn without mutating the input", () => {
    const blocks = [newBlock("heading", [])];
    const next = updateBlock(blocks, "heading-1", { visibleIn: ["live", "closed_pending"] });
    expect(next[0].visibleIn).toEqual(["live", "closed_pending"]);
    expect(blocks[0].visibleIn).toEqual(["live"]);

    const withProps = updateBlock(blocks, "heading-1", { props: { text: { default: "Hi" } } });
    expect(withProps[0].props).toEqual({ text: { default: "Hi" } });
    expect(blocks[0].props).toEqual({ text: { default: "" } });
  });

  it("hasVoteBlock and voteBlocksOf find vote blocks only", () => {
    const none = [newBlock("heading", [])];
    expect(hasVoteBlock(none)).toBe(false);
    expect(voteBlocksOf(none)).toEqual([]);

    const vote = newBlock("vote", ["heading-1"]);
    const mixed = [...none, vote];
    expect(hasVoteBlock(mixed)).toBe(true);
    expect(voteBlocksOf(mixed)).toEqual([vote]);
  });
});

describe("text helpers", () => {
  it("textOf reads plain strings and TextValue defaults and returns empty otherwise", () => {
    expect(textOf("Hi")).toBe("Hi");
    expect(textOf({ default: "Yo", translations: { de: "Hallo" } })).toBe("Yo");
    expect(textOf(undefined)).toBe("");
    expect(textOf(42)).toBe("");
    expect(textOf({ translations: { de: "Hallo" } })).toBe("");
  });

  it("setTextDefault replaces the default and keeps translations", () => {
    expect(setTextDefault("Hi", "Hello")).toEqual({ default: "Hello" });
    expect(
      setTextDefault({ default: "Hi", translations: { de: "Hallo" } }, "Hey")
    ).toEqual({ default: "Hey", translations: { de: "Hallo" } });
  });

  it("setTranslation adds, replaces and removes a locale", () => {
    expect(setTranslation(undefined, "de", "Hallo")).toEqual({
      default: "",
      translations: { de: "Hallo" }
    });
    expect(
      setTranslation({ default: "Hi", translations: { de: "Hallo", fr: "Salut" } }, "de", "Servus")
    ).toEqual({ default: "Hi", translations: { de: "Servus", fr: "Salut" } });

    const removed = setTranslation({ default: "Hi", translations: { de: "Hallo" } }, "de", "");
    expect(removed).toEqual({ default: "Hi" });
    expect(removed).not.toHaveProperty("translations");

    const blank = setTranslation({ default: "Hi", translations: { de: "Hallo" } }, "de", "   ");
    expect(blank).toEqual({ default: "Hi" });
  });
});

describe("collectTextFields and applyTextField", () => {
  it("collects heading text and skips non-text props like the copy code", () => {
    const blocks: Block[] = [
      { id: "h", type: "heading", props: { text: { default: "Hello" }, align: "center" }, visibleIn: ["live"] },
      { id: "c", type: "copy_code", props: { code: "SAVE10", label: "Code" }, visibleIn: ["live"] }
    ];
    const fields = collectTextFields(blocks);
    expect(fields.map((field) => [field.blockId, field.path])).toEqual([
      ["h", "text"],
      ["c", "label"]
    ]);
    expect(fields[0]).toMatchObject({
      blockId: "h",
      blockType: "heading",
      value: { default: "Hello" }
    });
  });

  it("collects vote question and option labels by path", () => {
    const vote = newBlock("vote", []);
    const fields = collectTextFields([vote]);
    expect(fields.map((field) => field.path)).toEqual([
      "question",
      "options.0.label",
      "options.1.label"
    ]);
    expect(fields.every((field) => field.label.length > 0)).toBe(true);
  });

  it("normalizes a plain string prop into a TextValue", () => {
    const blocks: Block[] = [
      { id: "b", type: "button", props: { label: "Open" }, visibleIn: ["live"] }
    ];
    expect(collectTextFields(blocks)[0].value).toEqual({ default: "Open" });
  });

  it("applyTextField updates a top-level text prop without mutating the input", () => {
    const blocks = [newBlock("heading", [])];
    const next = applyTextField(blocks, "heading-1", "text", { default: "Hi" });
    expect(next[0].props).toEqual({ text: { default: "Hi" } });
    expect(blocks[0].props).toEqual({ text: { default: "" } });
  });

  it("applyTextField updates a vote option label by its indexed path", () => {
    const blocks = [newBlock("vote", [])];
    const next = applyTextField(blocks, "vote-1", "options.1.label", {
      default: "Visitors",
      translations: { de: "Gaeste" }
    });
    const options = next[0].props.options as Array<{ id: string; label: unknown }>;
    expect(options[1]).toEqual({
      id: "away",
      label: { default: "Visitors", translations: { de: "Gaeste" } }
    });
    expect(options[0]).toEqual({ id: "home", label: { default: "Home" } });

    const original = blocks[0].props.options as Array<{ label: unknown }>;
    expect(original[1].label).toEqual({ default: "Away" });
  });

  it("applyTextField updates the vote question", () => {
    const next = applyTextField([newBlock("vote", [])], "vote-1", "question", { default: "Who wins?" });
    expect(next[0].props.question).toEqual({ default: "Who wins?" });
  });
});

describe("validateDraft", () => {
  it("accepts a valid draft", () => {
    expect(validateDraft(validDraft())).toEqual([]);
  });

  it("requires a title of at most 120 characters", () => {
    const empty = validateDraft(validDraft({ title: "   " }));
    expect(empty.some((message) => /title/i.test(message))).toBe(true);

    const long = validateDraft(validDraft({ title: "x".repeat(121) }));
    expect(long.some((message) => /title/i.test(message))).toBe(true);

    expect(validateDraft(validDraft({ title: "x".repeat(120) }))).toEqual([]);
  });

  it("requires startsAt", () => {
    const messages = validateDraft(validDraft({ startsAt: "" }));
    expect(messages.some((message) => /start/i.test(message))).toBe(true);
  });

  it("requires displayUntil to be after startsAt when it is set", () => {
    const messages = validateDraft(
      validDraft({ displayUntil: localInput(2026, 11, 30, 10, 0) })
    );
    expect(messages.some((message) => /display|end|until/i.test(message))).toBe(true);
    expect(validateDraft(validDraft({ displayUntil: "" }))).toEqual([]);
  });

  it("keeps votingClosesAt inside the start and display window", () => {
    const before = validateDraft(
      validDraft({ votingClosesAt: localInput(2026, 11, 30, 10, 0), rulesText: "Rules" })
    );
    expect(before.some((message) => /voting/i.test(message))).toBe(true);

    const after = validateDraft(
      validDraft({ votingClosesAt: localInput(2026, 12, 20, 10, 0), rulesText: "Rules" })
    );
    expect(after.some((message) => /voting/i.test(message))).toBe(true);

    const inside = validateDraft(
      validDraft({
        votingClosesAt: localInput(2026, 12, 5, 10, 0),
        rulesText: "Rules",
        blocks: [newBlock("vote", [])]
      })
    );
    expect(inside).toEqual([]);
  });

  it("requires votingClosesAt and rules text for a modal with a vote block", () => {
    const missing = validateDraft(validDraft({ blocks: [newBlock("vote", [])] }));
    expect(missing.some((message) => /voting/i.test(message))).toBe(true);
    expect(missing.some((message) => /rules/i.test(message))).toBe(true);

    const ok = validateDraft(
      validDraft({
        blocks: [newBlock("vote", [])],
        votingClosesAt: localInput(2026, 12, 5, 10, 0),
        rulesText: "No purchase necessary"
      })
    );
    expect(ok).toEqual([]);
  });

  it("requires a choice vote to have 2 to 10 labelled options", () => {
    const vote = newBlock("vote", []);
    const one = { ...vote, props: { ...vote.props, options: [{ id: "home", label: { default: "Home" } }] } };
    const blank = {
      ...vote,
      props: {
        ...vote.props,
        options: [
          { id: "home", label: { default: "Home" } },
          { id: "away", label: { default: "  " } }
        ]
      }
    };
    const eleven = {
      ...vote,
      props: {
        ...vote.props,
        options: Array.from({ length: 11 }, (_, index) => ({
          id: `o${index}`,
          label: { default: `Option ${index}` }
        }))
      }
    };
    const rules = { votingClosesAt: localInput(2026, 12, 5, 10, 0), rulesText: "Rules" };

    expect(validateDraft(validDraft({ ...rules, blocks: [one] })).length).toBeGreaterThan(0);
    expect(validateDraft(validDraft({ ...rules, blocks: [blank] })).length).toBeGreaterThan(0);
    expect(validateDraft(validDraft({ ...rules, blocks: [eleven] })).length).toBeGreaterThan(0);
    expect(validateDraft(validDraft({ ...rules, blocks: [vote] }))).toEqual([]);
  });

  it("requires n of at least 1 for every_n_* frequency modes", () => {
    for (const mode of ["every_n_hours", "every_n_opens"] as const) {
      expect(
        validateDraft(validDraft({ frequency: { mode, n: "", maxImpressions: "" } })).length
      ).toBeGreaterThan(0);
      expect(
        validateDraft(validDraft({ frequency: { mode, n: "0", maxImpressions: "" } })).length
      ).toBeGreaterThan(0);
      expect(
        validateDraft(validDraft({ frequency: { mode, n: "2", maxImpressions: "" } }))
      ).toEqual([]);
    }
    expect(
      validateDraft(validDraft({ frequency: { mode: "daily", n: "", maxImpressions: "" } }))
    ).toEqual([]);
  });

  it("requires a non-empty copy code", () => {
    const copy = { ...newBlock("copy_code", []), props: { code: "" } };
    expect(validateDraft(validDraft({ blocks: [copy] })).length).toBeGreaterThan(0);
    const filled = { ...newBlock("copy_code", []), props: { code: "SAVE10" } };
    expect(validateDraft(validDraft({ blocks: [filled] }))).toEqual([]);
  });

  it("requires https for url buttons and image urls", () => {
    const button = {
      ...newBlock("button", []),
      props: { label: { default: "Go" }, action: { type: "url", url: "http://example.test" } }
    };
    expect(validateDraft(validDraft({ blocks: [button] })).length).toBeGreaterThan(0);

    const secureButton = {
      ...button,
      props: { label: { default: "Go" }, action: { type: "url", url: "https://example.test" } }
    };
    expect(validateDraft(validDraft({ blocks: [secureButton] }))).toEqual([]);

    const image = { ...newBlock("image", []), props: { alt: { default: "" }, url: "http://example.test/a.png" } };
    expect(validateDraft(validDraft({ blocks: [image] })).length).toBeGreaterThan(0);
  });
});

describe("draftToRequestBody with a saved record", () => {
  const record = {
    ...({} as EventModalRecord),
    startsAt: "2026-12-01T10:00:30.123Z",
    votingClosesAt: "2026-12-05T18:00:45.000Z",
    displayUntil: "2026-12-10T00:00:00.000Z"
  } as EventModalRecord;

  it("leaves out dates whose input is unchanged (keeps stored seconds)", () => {
    const draft = validDraft({
      startsAt: toLocalInput(record.startsAt),
      votingClosesAt: toLocalInput(record.votingClosesAt),
      displayUntil: toLocalInput(record.displayUntil)
    });
    const body = draftToRequestBody(draft, record);
    expect(body).not.toHaveProperty("startsAt");
    expect(body).not.toHaveProperty("votingClosesAt");
    expect(body).not.toHaveProperty("displayUntil");
  });

  it("still sends a date the admin changed", () => {
    const draft = validDraft({
      startsAt: toLocalInput(record.startsAt),
      votingClosesAt: toLocalInput(record.votingClosesAt),
      displayUntil: "2027-01-01T00:00"
    });
    const body = draftToRequestBody(draft, record);
    expect(body).not.toHaveProperty("startsAt");
    expect(body.displayUntil).toBe(fromLocalInput("2027-01-01T00:00"));
  });

  it("sends every date when creating", () => {
    expect(draftToRequestBody(validDraft())).toHaveProperty("startsAt");
  });
});
