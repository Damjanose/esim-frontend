import { describe, expect, it } from "vitest";
import { highInterestFewSales } from "./destinations";

const row = (destination: string, views: number, visitors: number, conversion: number | null) => ({ destination, views, visitors, conversion });

describe("highInterestFewSales", () => {
  it("flags a destination in the top 25% of views with conversion under half the average", () => {
    const rows = [
      row("a", 1000, 300, 0.01),
      row("b", 100, 200, 0.2),
      row("c", 90, 200, 0.2),
      row("d", 80, 200, 0.2)
    ];
    expect([...highInterestFewSales(rows, 0.1)]).toEqual(["a"]);
  });

  it("never flags a destination with fewer than 100 visitors", () => {
    const rows = [row("a", 1000, 99, 0), row("b", 10, 200, 0.5), row("c", 10, 200, 0.5), row("d", 10, 200, 0.5)];
    expect(highInterestFewSales(rows, 0.5).has("a")).toBe(false);
  });

  it("flags nothing without an average conversion", () => {
    expect(highInterestFewSales([row("a", 1000, 300, 0)], null).size).toBe(0);
  });

  it("ignores rows with no conversion value", () => {
    expect(highInterestFewSales([row("a", 1000, 300, null)], 0.1).size).toBe(0);
  });
});
