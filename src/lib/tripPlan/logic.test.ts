import { describe, expect, it } from "vitest";
import {
  DEFAULT_DAYS,
  EDIT_PROMPT_MAX,
  EMPTY_TRIP_PLAN_FORM,
  MAX_CHIPS,
  addChips,
  buildTripPlanInput,
  clampInt,
  generatingEtaIndex,
  generatingStepsDone,
  isPlanId,
  isVersionParam,
  isoDateToDdMmYyyy,
  latestVersion,
  readEditPrompt,
  refineState,
  splitPlansByWindow,
  summaryCta,
  todayIso,
  versionLabel,
  type TripPlanForm
} from "./logic";

const base: TripPlanForm = { ...EMPTY_TRIP_PLAN_FORM, country: "  Portugal ", people: 2 };

describe("clampInt", () => {
  it("clamps and rounds", () => {
    expect(clampInt(0, 1, 30)).toBe(1);
    expect(clampInt(31, 1, 30)).toBe(30);
    expect(clampInt(7.4, 1, 30)).toBe(7);
    expect(clampInt(Number.NaN, 1, 30)).toBe(1);
  });
});

describe("dates", () => {
  it("converts the date input value to DD/MM/YYYY", () => {
    expect(isoDateToDdMmYyyy("2026-10-04")).toBe("04/10/2026");
    expect(isoDateToDdMmYyyy("")).toBe("");
    expect(isoDateToDdMmYyyy("04/10/2026")).toBe("");
  });

  it("gives today in local time", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("buildTripPlanInput", () => {
  it("sends required fields and omits empty optionals", () => {
    const input = buildTripPlanInput(base, "en");
    expect(input).toEqual({ country: "Portugal", durationDays: DEFAULT_DAYS, people: 2, lang: "en" });
  });

  it("sends every optional in the API's format", () => {
    const input = buildTripPlanInput(
      {
        ...base,
        startDate: "2026-10-14",
        transport: "public",
        cities: ["Lisbon", "Sintra"],
        citiesDraft: " Porto ",
        mustSee: ["Belém"],
        mustSeeDraft: " Fado night ",
        accommodation: ["Hotel in Alfama"],
        accommodationDraft: " Airbnb ",
        notes: " quiet ",
        pets: true
      },
      "en"
    );
    expect(input.startDate).toBe("14/10/2026");
    expect(input.transport).toBe("public");
    expect(input.cities).toEqual(["Lisbon", "Sintra", "Porto"]);
    expect(input.mustSee).toBe("Belém, Fado night");
    expect(input.accommodation).toBe("Hotel in Alfama, Airbnb");
    expect(input.custom).toBe("quiet");
    expect(input.pets).toBe(true);
  });

  it("clamps out-of-range days and people", () => {
    const input = buildTripPlanInput({ ...base, days: 99, people: 0 }, "en");
    expect(input.durationDays).toBe(30);
    expect(input.people).toBe(1);
  });
});

describe("addChips", () => {
  it("splits on commas, trims, dedupes and caps", () => {
    expect(addChips([], " Lisbon, , Sintra ")).toEqual(["Lisbon", "Sintra"]);
    expect(addChips(["Lisbon"], "lisbon, Porto")).toEqual(["Lisbon", "Porto"]);
    expect(addChips([], "دبي، أبوظبي")).toHaveLength(2);
    const full = Array.from({ length: MAX_CHIPS }, (_, i) => `City ${i}`);
    expect(addChips(full, "Extra")).toHaveLength(MAX_CHIPS);
  });
});

describe("generating loader", () => {
  it("never ticks the last step and switches to the slow message", () => {
    expect(generatingStepsDone(0, 5000, 3)).toBe(0);
    expect(generatingStepsDone(5000, 5000, 3)).toBe(1);
    expect(generatingStepsDone(60000, 5000, 3)).toBe(2);
    expect(generatingEtaIndex(30000, 8000, 3, 45000)).toBe(2);
    expect(generatingEtaIndex(45000, 8000, 3, 45000)).toBe(3);
  });
});

describe("refineState", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");
  const edits = { remaining: 2, limit: 3, editableUntil: "2026-09-26T12:00:00.000Z", canEdit: true };

  it("is open with edits left inside the window", () => {
    expect(refineState(edits, now)).toMatchObject({ kind: "open", remaining: 2, limit: 3 });
  });

  it("is hidden without edit info or when editing is off", () => {
    expect(refineState(undefined, now)).toEqual({ kind: "hidden" });
    expect(refineState({ ...edits, limit: 0 }, now)).toEqual({ kind: "hidden" });
  });

  it("is closed when used up, disallowed or expired", () => {
    expect(refineState({ ...edits, remaining: 0 }, now)).toEqual({ kind: "closed" });
    expect(refineState({ ...edits, canEdit: false }, now)).toEqual({ kind: "closed" });
    expect(refineState({ ...edits, editableUntil: "2026-09-01T00:00:00.000Z" }, now)).toEqual({ kind: "closed" });
  });
});

describe("splitPlansByWindow", () => {
  const now = new Date("2026-09-30T00:00:00.000Z");
  it("trusts the archived flag, else falls back to the window", () => {
    const plans = [
      { id: "a", archived: false, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", archived: true, createdAt: "2026-09-29T00:00:00.000Z" },
      { id: "c", createdAt: "2026-09-01T00:00:00.000Z" },
      { id: "d", createdAt: "2026-09-25T00:00:00.000Z" }
    ];
    const { current, history } = splitPlansByWindow(plans, 14, now);
    expect(current.map((p) => p.id)).toEqual(["a", "d"]);
    expect(history.map((p) => p.id)).toEqual(["b", "c"]);
  });
});

describe("small helpers", () => {
  it("summaryCta", () => {
    expect(summaryCta({ free: false })).toBe("purchase");
    expect(summaryCta({ free: true })).toBe("free");
    expect(summaryCta({ free: false, purchased: true })).toBe("download");
  });

  it("latestVersion and versionLabel", () => {
    expect(latestVersion(undefined)).toBeNull();
    expect(latestVersion([{ n: 0 }, { n: 2 }, { n: 1 }])).toBe(2);
    expect(versionLabel(0)).toBe("Original");
    expect(versionLabel(2)).toBe("Edit 2");
  });

  it("guards BFF path segments and prompts", () => {
    expect(isPlanId("cmf1abc_DEF-9")).toBe(true);
    expect(isPlanId("../admin")).toBe(false);
    expect(isPlanId("")).toBe(false);
    expect(isVersionParam("12")).toBe(true);
    expect(isVersionParam("-1")).toBe(false);
    expect(isVersionParam("1.5")).toBe(false);
    expect(readEditPrompt("  later mornings ")).toBe("later mornings");
    expect(readEditPrompt("   ")).toBeNull();
    expect(readEditPrompt("x".repeat(EDIT_PROMPT_MAX + 1))).toBeNull();
    expect(readEditPrompt(42)).toBeNull();
  });
});
