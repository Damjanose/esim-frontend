function titleCase(code: string): string {
  return code
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * The name for a backend `countryCode`, which is a slugified country name
 * (e.g. "united-states" → "United States"). The web's own display names are keyed by
 * public slug and are not used here, because they differ (the catalogue shows "USA").
 */
export function destinationLabel(countryCode: string): string {
  if (!countryCode) return "—";
  return titleCase(countryCode);
}
