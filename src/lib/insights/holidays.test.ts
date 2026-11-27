import { describe, expect, it } from "vitest";
import { formatDaysAway, pricingHref, upcomingHolidayRange, upcomingHolidays } from "./holidays";
import type { ChartNote } from "./types";

const holiday = (date: string, title: string, markets?: string[]): ChartNote => ({
  id: `holiday:${date}:${title}`,
  date,
  kind: "holiday",
  title,
  readOnly: true,
  ...(markets ? { markets } : {})
});

describe("upcomingHolidayRange", () => {
  it("runs from today to 90 days ahead", () => {
    expect(upcomingHolidayRange("2026-11-27")).toEqual({ from: "2026-11-27", to: "2027-02-25" });
  });
});

describe("upcomingHolidays", () => {
  it("keeps built-in holidays from today on, soonest first, with days away", () => {
    const list = upcomingHolidays(
      [
        holiday("2026-12-25", "Christmas Day"),
        holiday("2026-11-26", "US: Thanksgiving", ["United States"]),
        holiday("2026-11-27", "Black Friday"),
        holiday("2027-02-06", "Lunar New Year", ["China", "Korea"])
      ],
      "2026-11-27"
    );
    expect(list.map((h) => [h.date, h.daysAway])).toEqual([
      ["2026-11-27", 0],
      ["2026-12-25", 28],
      ["2027-02-06", 71]
    ]);
    expect(list[2].markets).toEqual(["China", "Korea"]);
    expect(list[0].markets).toEqual([]);
  });

  it("leaves out admin notes", () => {
    const adminNote: ChartNote = { id: "n1", date: "2026-12-01", kind: "promotion", title: "Sale", readOnly: false };
    expect(upcomingHolidays([adminNote], "2026-11-27")).toEqual([]);
  });
});

describe("formatDaysAway", () => {
  it("says today, tomorrow, or a count", () => {
    expect(formatDaysAway(0)).toBe("Today");
    expect(formatDaysAway(1)).toBe("Tomorrow");
    expect(formatDaysAway(12)).toBe("In 12 days");
  });
});

describe("pricingHref", () => {
  it("opens pricing searched for the market, or unfiltered for worldwide dates", () => {
    expect(pricingHref("United States")).toBe("/xpricing?q=United+States");
    expect(pricingHref()).toBe("/xpricing");
  });
});
