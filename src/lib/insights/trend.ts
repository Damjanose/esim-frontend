/** Geometry for the daily trend chart. Plain numbers, so the SVG stays a thin layer over this. */

export type TrendDay = { date: string; visitors: number; orders: number };
export type TrendPoint = { x: number; y: number; date: string; value: number };
export type TrendBar = { x: number; y: number; w: number; h: number; date: string; value: number };

export function trendGeometry(
  days: TrendDay[],
  { width, height, pad }: { width: number; height: number; pad: number }
): { line: TrendPoint[]; bars: TrendBar[]; maxVisitors: number; maxOrders: number } {
  const maxVisitors = Math.max(0, ...days.map((d) => d.visitors));
  const maxOrders = Math.max(0, ...days.map((d) => d.orders));
  const plotHeight = height - 2 * pad;
  const baseline = height - pad;
  const plotWidth = width - 2 * pad;
  const count = days.length;
  const step = count > 1 ? plotWidth / (count - 1) : 0;
  const xAt = (index: number) => (count > 1 ? pad + index * step : width / 2);

  const line = days.map((day, index) => ({
    x: xAt(index),
    y: maxVisitors > 0 ? baseline - (day.visitors / maxVisitors) * plotHeight : baseline,
    date: day.date,
    value: day.visitors
  }));

  const barWidth = Math.max(2, Math.min(18, (count > 1 ? step : plotWidth) * 0.5));
  const bars = days.map((day, index) => {
    const h = maxOrders > 0 ? (day.orders / maxOrders) * plotHeight : 0;
    return { x: xAt(index) - barWidth / 2, y: baseline - h, w: barWidth, h, date: day.date, value: day.orders };
  });

  return { line, bars, maxVisitors, maxOrders };
}

/** SVG path through the points. Empty when there are none. */
export function linePath(points: { x: number; y: number }[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

/** A phone is at least 320 px wide. Longer ranges get a wider chart that scrolls sideways. */
export function chartWidth(dayCount: number): number {
  return Math.max(320, dayCount * 14);
}
