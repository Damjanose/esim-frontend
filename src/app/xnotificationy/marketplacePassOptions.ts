/** Keep in sync with backend `MARKETPLACE_PASS_IDS` and mobile CONTINENTAL_PASSES. */
export const MARKETPLACE_PASS_OPTIONS = [
  { id: "", label: "None — open app normally" },
  { id: "europe", label: "Europe" },
  { id: "asia-pacific", label: "Asia-Pacific" },
  { id: "north-america", label: "North America" },
  { id: "latin-america", label: "Latin America" },
  { id: "global", label: "Global" },
] as const;

export type MarketplacePassOptionId = (typeof MARKETPLACE_PASS_OPTIONS)[number]["id"];

export function labelForPassId(passId: string | null | undefined): string {
  if (!passId) return "None";
  return MARKETPLACE_PASS_OPTIONS.find((o) => o.id === passId)?.label ?? passId;
}
