import { describe, expect, it } from "vitest";
import { groupNotesByMonth, monthLabel, monthBarHeights } from "./seasons";
import type { ChartNote } from "./types";

const note = (id: string, date: string): ChartNote => ({ id, date, kind: "holiday", title: id, readOnly: true });

describe("monthLabel", () => {
  it("shows a short month name and the year", () => {
    expect(monthLabel("2026-11")).toBe("Nov 2026");
    expect(monthLabel("2027-01")).toBe("Jan 2027");
  });
});

describe("groupNotesByMonth", () => {
  it("groups notes by YYYY-MM, in the order given", () => {
    const grouped = groupNotesByMonth([note("a", "2026-11-27"), note("b", "2026-12-25"), note("c", "2026-11-01")]);
    expect(grouped["2026-11"].map((n) => n.id)).toEqual(["a", "c"]);
    expect(grouped["2026-12"].map((n) => n.id)).toEqual(["b"]);
  });
});

describe("monthBarHeights", () => {
  it("scales each month's orders to the largest month, and gives 0 for every month when none has orders", () => {
    expect(monthBarHeights([{ orders: 10 }, { orders: 5 }, { orders: 0 }])).toEqual([1, 0.5, 0]);
    expect(monthBarHeights([{ orders: 0 }, { orders: 0 }])).toEqual([0, 0]);
  });
});
