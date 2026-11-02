/**
 * Honest plan details Airalo reports per package. The backend sends them only on
 * country-filtered package endpoints, so every field may be missing: absent means
 * unknown, and nothing here invents a claim.
 */
export type PlanNetwork = { name: string; types: string[] };

export type FairUsage = {
  policy: string | null;
  highSpeedMbPerDay: number | null;
  throttledSpeedKbps: number | null;
};

export type PlanDetails = {
  activationPolicy: string | null;
  planType: string | null;
  otherInfo: string | null;
  networks: PlanNetwork[];
  fairUsage: FairUsage | null;
};

/** The wire shape on /packages?country_code=XX and inside /packages/groups. */
export type ApiPlanDetails = {
  activation_policy?: string | null;
  plan_type?: string | null;
  other_info?: string | null;
  networks?: unknown;
  fair_usage?: unknown;
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const positive = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

export function mapPlanDetails(raw: ApiPlanDetails): PlanDetails | undefined {
  const present =
    raw.activation_policy !== undefined ||
    raw.plan_type !== undefined ||
    raw.other_info !== undefined ||
    raw.networks !== undefined ||
    raw.fair_usage !== undefined;
  if (!present) return undefined;

  const networks: PlanNetwork[] = [];
  if (Array.isArray(raw.networks)) {
    for (const item of raw.networks) {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
      const name = text(record?.name);
      if (!name) continue;
      const types = Array.isArray(record?.types)
        ? (record.types as unknown[]).map(text).filter((type): type is string => type !== null)
        : [];
      networks.push({ name, types });
    }
  }

  const fair = raw.fair_usage && typeof raw.fair_usage === "object" ? (raw.fair_usage as Record<string, unknown>) : null;

  return {
    activationPolicy: text(raw.activation_policy),
    planType: text(raw.plan_type),
    otherInfo: text(raw.other_info),
    networks,
    fairUsage: fair
      ? {
          policy: text(fair.policy),
          highSpeedMbPerDay: positive(fair.high_speed_mb_per_day),
          throttledSpeedKbps: positive(fair.throttled_speed_kbps)
        }
      : null
  };
}

const NEUTRAL_UNLIMITED = "Unlimited (fair-use policy applies)";

function trimNumber(value: number): string {
  return String(Number(value.toFixed(1)));
}

function formatDailyAllowance(mb: number): string {
  return mb >= 1024 ? `${trimNumber(mb / 1024)} GB/day` : `${Math.round(mb)} MB/day`;
}

function formatSpeed(kbps: number): string {
  return kbps >= 1000 ? `${trimNumber(kbps / 1000)} Mbps` : `${Math.round(kbps)} kbps`;
}

/** What "unlimited" really means for this plan, from the provider's fair-usage numbers or text. */
export function unlimitedPlanCopy(details: PlanDetails | undefined): string {
  const fair = details?.fairUsage;
  if (fair && (fair.highSpeedMbPerDay !== null || fair.throttledSpeedKbps !== null)) {
    const parts = ["Unlimited"];
    if (fair.highSpeedMbPerDay !== null) {
      let high = `high speed up to ${formatDailyAllowance(fair.highSpeedMbPerDay)}`;
      if (fair.throttledSpeedKbps !== null) high += `, then ${formatSpeed(fair.throttledSpeedKbps)}`;
      parts.push(high);
    } else if (fair.throttledSpeedKbps !== null) {
      parts.push(`slows to ${formatSpeed(fair.throttledSpeedKbps)} after fair use`);
    }
    return parts.join(" · ");
  }
  return fair?.policy ?? NEUTRAL_UNLIMITED;
}

/** "Starts when you first connect in Japan" / "Starts when you install the eSIM"; null when unknown. */
export function activationNote(details: PlanDetails | undefined, country?: string): string | null {
  switch (details?.activationPolicy) {
    case "first-usage":
      return country ? `Starts when you first connect in ${country}` : "Starts when you first connect";
    case "installation":
      return "Starts when you install the eSIM";
    default:
      return null;
  }
}

const GENERATION_ORDER = ["5G", "4G", "LTE", "3G"];

/** "EE 5G · Vodafone 4G": each network with its best reported generation. Null when none are listed. */
export function networksLabel(details: PlanDetails | undefined): string | null {
  if (!details || details.networks.length === 0) return null;
  return details.networks
    .map((network) => {
      const best = GENERATION_ORDER.find((generation) =>
        network.types.some((type) => type.toUpperCase() === generation)
      );
      return best ? `${network.name} ${best}` : network.name;
    })
    .join(" · ");
}
