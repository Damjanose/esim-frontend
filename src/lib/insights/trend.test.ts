import { describe, expect, it } from "vitest";
import { chartWidth, linePath, trendGeometry } from "./trend";

const days = [
  { date: "2026-11-01", visitors: 10, orders: 0 },
  { date: "2026-11-02", visitors: 20, orders: 2 },
  { date: "2026-11-03", visitors: 0, orders: 1 }
];

describe("trendGeometry", () => {
  it("places one point per day, from the left pad to the right pad", () => {
    const geometry = trendGeometry(days, { width: 200, height: 100, pad: 10 });
    expect(geometry.line.map((p) => p.x)).toEqual([10, 100, 190]);
    expect(geometry.line.map((p) => p.date)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
  });

  it("scales visitors to the tallest day, with the baseline at the bottom pad", () => {
    const geometry = trendGeometry(days, { width: 200, height: 100, pad: 10 });
    expect(geometry.maxVisitors).toBe(20);
    expect(geometry.line[1].y).toBe(10);
    expect(geometry.line[2].y).toBe(90);
  });

  it("gives order bars a height scaled to the largest order count", () => {
    const geometry = trendGeometry(days, { width: 200, height: 100, pad: 10 });
    expect(geometry.maxOrders).toBe(2);
    const bar = geometry.bars[1];
    expect(bar.value).toBe(2);
    expect(bar.y + bar.h).toBe(90);
    expect(bar.h).toBeCloseTo(80, 5);
    expect(geometry.bars[0].h).toBe(0);
  });

  it("does not divide by zero when every day is empty", () => {
    const geometry = trendGeometry(
      [{ date: "2026-11-01", visitors: 0, orders: 0 }],
      { width: 100, height: 50, pad: 5 }
    );
    expect(geometry.maxVisitors).toBe(0);
    expect(Number.isFinite(geometry.line[0].y)).toBe(true);
    expect(geometry.bars[0].h).toBe(0);
  });

  it("returns nothing for no days", () => {
    const geometry = trendGeometry([], { width: 100, height: 50, pad: 5 });
    expect(geometry.line).toEqual([]);
    expect(geometry.bars).toEqual([]);
  });
});

describe("linePath", () => {
  it("joins points into an SVG path", () => {
    expect(linePath([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("M 1 2 L 3 4");
  });

  it("is empty for no points", () => {
    expect(linePath([])).toBe("");
  });
});

describe("chartWidth", () => {
  it("is at least the phone width and grows with the number of days, so it scrolls sideways", () => {
    expect(chartWidth(7)).toBe(320);
    expect(chartWidth(60)).toBe(840);
  });
});
