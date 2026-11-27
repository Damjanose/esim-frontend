export type DestinationFlagInput = { destination: string; views: number; visitors: number; conversion: number | null };

/**
 * Destinations people look at a lot but rarely buy: in the top quarter of views, with
 * conversion under half the average, and at least 100 visitors. This is a pattern to
 * look at, not a proven cause.
 */
export function highInterestFewSales(rows: DestinationFlagInput[], averageConversion: number | null): Set<string> {
  const flagged = new Set<string>();
  if (averageConversion === null || rows.length === 0) return flagged;
  const sortedViews = rows.map((row) => row.views).sort((a, b) => a - b);
  const topQuarterStart = sortedViews[Math.floor(sortedViews.length * 0.75)] ?? 0;
  for (const row of rows) {
    if (row.conversion === null || row.visitors < 100) continue;
    if (row.views >= topQuarterStart && row.conversion < averageConversion / 2) flagged.add(row.destination);
  }
  return flagged;
}
