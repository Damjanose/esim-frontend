import { describe, expect, it } from "vitest";
import { stepRates } from "./funnel";

describe("stepRates", () => {
  it("gives each step's share of the first step and the drop from the step before", () => {
    const rows = stepRates([
      { step: "marketplace", visitors: 200 },
      { step: "destination", visitors: 100 },
      { step: "begin", visitors: 25 }
    ]);
    expect(rows).toEqual([
      { step: "marketplace", visitors: 200, shareOfFirst: 1, dropFromPrevious: null },
      { step: "destination", visitors: 100, shareOfFirst: 0.5, dropFromPrevious: 0.5 },
      { step: "begin", visitors: 25, shareOfFirst: 0.125, dropFromPrevious: 0.75 }
    ]);
  });

  it("gives nulls when the first step is zero", () => {
    const rows = stepRates([
      { step: "marketplace", visitors: 0 },
      { step: "destination", visitors: 0 }
    ]);
    expect(rows.map((row) => row.shareOfFirst)).toEqual([null, null]);
    expect(rows.map((row) => row.dropFromPrevious)).toEqual([null, null]);
  });

  it("gives a null drop when the step before had no visitors", () => {
    const rows = stepRates([
      { step: "marketplace", visitors: 10 },
      { step: "destination", visitors: 0 },
      { step: "begin", visitors: 0 }
    ]);
    expect(rows[2].dropFromPrevious).toBeNull();
  });
});
