/** Campaign link builder for admins. Values are cleaned the same way as the analytics campaign reader expects. */

export const CAMPAIGN_MEDIUMS = ["cpc", "paid_social", "email", "influencer", "qr", "referral"] as const;

const ALLOWED_HOST = "esim.uplisoft.com";

export type CampaignLinkInput = {
  base: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
};

export type CampaignLinkResult = { url: string } | { error: "base_not_allowed" | "source_required" | "medium_required" | "campaign_required" };

/** Lower case, spaces become dashes, anything outside [a-z0-9_-] is removed. */
export function sanitizeUtmValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
}

export function buildCampaignLink(input: CampaignLinkInput): CampaignLinkResult {
  let url: URL;
  try {
    url = new URL(input.base);
  } catch {
    return { error: "base_not_allowed" };
  }
  if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST) return { error: "base_not_allowed" };

  const source = sanitizeUtmValue(input.source);
  const medium = sanitizeUtmValue(input.medium);
  const campaign = sanitizeUtmValue(input.campaign);
  if (!source) return { error: "source_required" };
  if (!medium) return { error: "medium_required" };
  if (!campaign) return { error: "campaign_required" };

  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  const content = input.content ? sanitizeUtmValue(input.content) : "";
  if (content) url.searchParams.set("utm_content", content);
  return { url: url.toString() };
}
