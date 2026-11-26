import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a header and rows", () => {
    expect(toCsv(["name", "visitors"], [["Turkey", 12]])).toBe("name,visitors\nTurkey,12");
  });

  it("quotes cells with commas, quotes and newlines", () => {
    expect(toCsv(["a"], [["x, y"], ['say "hi"'], ["line\nbreak"]])).toBe('a\n"x, y"\n"say ""hi"""\n"line\nbreak"');
  });

  it("prefixes cells that start with = + - or @ so a spreadsheet never runs them as formulas", () => {
    expect(toCsv(["a"], [["=SUM(A1)"], ["+1"], ["-2"], ["@cmd"]])).toBe("a\n'=SUM(A1)\n'+1\n'-2\n'@cmd");
  });

  it("writes null as an empty cell", () => {
    expect(toCsv(["a", "b"], [[null, 3]])).toBe("a,b\n,3");
  });

  it("also guards a cell that starts with a tab or a carriage return", () => {
    // A tab-led cell is not quoted; a carriage return forces RFC quoting around the guarded cell.
    expect(toCsv(["a"], [["\t=cmd"]])).toBe("a\n'\t=cmd");
    expect(toCsv(["a"], [["\r=cmd"]])).toBe("a\n\"'\r=cmd\"");
  });
});
