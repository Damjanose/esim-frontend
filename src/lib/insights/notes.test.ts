import { describe, expect, it } from "vitest";
import type { ChartNote } from "./types";
import { notePositions, notesByDate } from "./notes";

const note = (id: string, date: string, readOnly = false): ChartNote => ({ id, date, kind: "ad", title: id, readOnly });

describe("notesByDate", () => {
  it("groups notes by their date, keeping the order given", () => {
    const grouped = notesByDate([note("a", "2026-11-27"), note("b", "2026-11-28"), note("c", "2026-11-27")]);
    expect(grouped["2026-11-27"].map((n) => n.id)).toEqual(["a", "c"]);
    expect(grouped["2026-11-28"].map((n) => n.id)).toEqual(["b"]);
  });
});

describe("notePositions", () => {
  it("gives the x index of each note that falls inside the days", () => {
    const days = ["2026-11-25", "2026-11-26", "2026-11-27"];
    const positions = notePositions([note("a", "2026-11-27"), note("b", "2026-12-01"), note("c", "2026-11-25", true)], days);
    expect(positions.map((p) => [p.note.id, p.index])).toEqual([
      ["a", 2],
      ["c", 0]
    ]);
  });
});
