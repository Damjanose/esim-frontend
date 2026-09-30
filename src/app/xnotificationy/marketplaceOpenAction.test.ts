import { describe, expect, it } from "vitest";
import {
  draftToOpenAction,
  EMPTY_OPEN_ACTION_DRAFT,
  openActionToDraft,
  summarizeOpenAction,
} from "./marketplaceOpenAction";

describe("marketplaceOpenAction helpers", () => {
  it("builds null when draft is empty", () => {
    expect(draftToOpenAction(EMPTY_OPEN_ACTION_DRAFT)).toBeNull();
  });

  it("builds combinable pass + filters", () => {
    expect(
      draftToOpenAction({
        ...EMPTY_OPEN_ACTION_DRAFT,
        passId: "europe",
        destinations: ["italy", "albania"],
        durationFrom: "7",
        durationTo: "30",
        priceTo: "25",
        sort: "price_asc",
      }),
    ).toEqual({
      type: "marketplace",
      passId: "europe",
      filters: {
        destination: ["italy", "albania"],
        durationFrom: 7,
        durationTo: 30,
        priceTo: 25,
        sort: "price_asc",
      },
    });
  });

  it("round-trips openAction to draft", () => {
    const action = {
      type: "marketplace" as const,
      passId: "global",
      filters: { destination: ["japan"], includeUnlimited: false },
    };
    expect(draftToOpenAction(openActionToDraft(action))).toEqual(action);
  });

  it("summarizes for list rows", () => {
    expect(summarizeOpenAction(null)).toBe("None");
    expect(
      summarizeOpenAction({
        type: "marketplace",
        passId: "europe",
        filters: { durationFrom: 7, durationTo: 14 },
      }),
    ).toContain("europe");
  });

  it("builds, round-trips and summarizes a trip_plan action", () => {
    const draft = { ...EMPTY_OPEN_ACTION_DRAFT, target: "trip_plan" as const, passId: "europe" };
    expect(draftToOpenAction(draft)).toEqual({ type: "trip_plan" });
    expect(openActionToDraft({ type: "trip_plan" })).toEqual({
      ...EMPTY_OPEN_ACTION_DRAFT,
      target: "trip_plan",
    });
    expect(summarizeOpenAction({ type: "trip_plan" })).toBe("Plan a trip");
  });
});
