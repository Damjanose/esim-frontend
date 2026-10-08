import type { PriceIndexRow } from "./destinationPricing";

export type PriceIndexSummary = {
  destinationCount: number;
  cheapestPerGb: PriceIndexRow | null;
  priciestPerGb: PriceIndexRow | null;
  /** Median of each destination's best price per GB, in EUR. */
  medianPerGb: number | null;
};

export function formatEur(value: number): string {
  return `€${value.toFixed(2)}`;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Headline numbers for the price index, computed only from live rows. */
export function summarizePriceIndex(rows: PriceIndexRow[]): PriceIndexSummary {
  const sized = rows
    .filter((row): row is PriceIndexRow & { bestPerGb: NonNullable<PriceIndexRow["bestPerGb"]> } => row.bestPerGb !== null)
    .sort((a, b) => a.bestPerGb.pricePerGb - b.bestPerGb.pricePerGb);

  return {
    destinationCount: rows.length,
    cheapestPerGb: sized[0] ?? null,
    priciestPerGb: sized.length > 1 ? sized[sized.length - 1] : null,
    medianPerGb: median(sized.map((row) => row.bestPerGb.pricePerGb))
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The downloadable copy of the price index table. */
export function priceIndexCsv(rows: PriceIndexRow[], siteUrl: string, updatedAt: string): string {
  const header = [
    "destination",
    "from_price_eur",
    "best_price_per_gb_eur",
    "best_value_plan_data",
    "best_value_plan_validity",
    "best_value_plan_price_eur",
    "plans_available",
    "url",
    "updated_at"
  ];
  const lines = rows.map((row) =>
    [
      row.name,
      row.fromPrice.toFixed(2),
      row.bestPerGb ? row.bestPerGb.pricePerGb.toFixed(2) : "",
      row.bestPerGb?.dataLabel ?? "",
      row.bestPerGb?.durationLabel ?? "",
      row.bestPerGb ? row.bestPerGb.priceNumeric.toFixed(2) : "",
      row.planCount,
      `${siteUrl}${row.path}`,
      updatedAt
    ]
      .map(csvCell)
      .join(",")
  );
  return `${[header.join(","), ...lines].join("\n")}\n`;
}
