export type CleanCampaign = { source: string; medium: string | null; campaign: string | null };

const MAX_UTM_LENGTH = 80;

/** Same drop rules as search text: no "@", no 6+ digits in a row (spaces and dashes ignored). */
export function cleanUtmValue(raw: string | null | undefined): string | null {
  const value = raw?.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_UTM_LENGTH) ?? "";
  if (!value) return null;
  if (value.includes("@")) return null;
  if (/\d{6}/.test(value.replace(/[\s-]/g, ""))) return null;
  return value;
}

/**
 * A campaign from the landing URL. A value that fails the rules becomes null. If the source
 * is null, the whole campaign is null, because a campaign without its source means nothing.
 */
export function cleanCampaign(input: { source: string | null; medium: string | null; campaign: string | null }): CleanCampaign | null {
  const source = cleanUtmValue(input.source);
  if (!source) return null;
  return {
    source,
    medium: cleanUtmValue(input.medium),
    campaign: cleanUtmValue(input.campaign)
  };
}
