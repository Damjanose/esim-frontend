export type QrSource =
  | { kind: "image"; src: string }
  | { kind: "activation"; code: string }
  | { kind: "none" };

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * The provider documents `qrcode` as "base64 PNG or URL", and some records carry
 * a raw LPA activation string instead, so all three shapes are handled.
 */
export function resolveQrSource(qrcode: string | undefined | null): QrSource {
  const value = qrcode?.trim();

  if (!value) {
    return { kind: "none" };
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return { kind: "image", src: value };
  }

  if (value.startsWith("data:image/")) {
    return { kind: "image", src: value };
  }

  if (value.toUpperCase().startsWith("LPA:")) {
    return { kind: "activation", code: value };
  }

  if (value.length > 32 && BASE64_PATTERN.test(value)) {
    return { kind: "image", src: `data:image/png;base64,${value}` };
  }

  return { kind: "activation", code: value };
}

export type UsagePayload = {
  available?: boolean;
  reason?: string;
  message?: string;
  /** What GET /orders/:id/usage sends today (backend normalizeSimUsage), in MB. */
  data_total_mb?: number;
  data_remaining_mb?: number;
  is_unlimited?: boolean;
  /** Older field names. Still read, so a payload in either shape summarises the same. */
  remaining?: number;
  total?: number;
  expiredAt?: string;
  /** Airalo's expiry for the live package (ISO) or null; preferred over the order's own. */
  expires_at?: string | null;
  provider_status?: string;
  /** When the figures were actually read from Airalo (server cache fill time), ISO. */
  last_synced_at?: string;
};

export type UsageSummary =
  | {
      available: true;
      /** Uncapped plan: there is no meaningful remaining/total pair. */
      unlimited: boolean;
      usedPercent: number;
      remainingLabel: string;
      totalLabel: string;
      expiresAt?: string;
      lastSyncedAt?: string;
    }
  | { available: false; message: string };

const UNAVAILABLE_MESSAGES: Record<string, string> = {
  no_iccid: "Usage will appear once your eSIM finishes provisioning.",
  provider_error: "Usage is unavailable from the provider right now. Please check back shortly."
};

/** Shared so usage summaries and the per-eSIM plan history read identically. */
export function formatMegabytes(value: number): string {
  if (value >= 1024) {
    const gb = value / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${Math.round(value)} MB`;
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

/**
 * The backend's usage route answers with `data_total_mb` / `data_remaining_mb` /
 * `is_unlimited` (normalizeSimUsage). This used to read only `total` / `remaining`,
 * so every live plan showed "0 MB of 0 MB remaining".
 *
 * Unavailable usage is reported as an explanation rather than zeroes, because
 * "0 GB used" would be a lie for an eSIM that is not provisioned yet.
 */
export function summariseUsage(usage: UsagePayload | null | undefined): UsageSummary {
  if (!usage || usage.available !== true) {
    return {
      available: false,
      message:
        usage?.message ??
        UNAVAILABLE_MESSAGES[usage?.reason ?? ""] ??
        "Usage is unavailable right now."
    };
  }

  if (usage.is_unlimited === true) {
    return {
      available: true,
      unlimited: true,
      usedPercent: 0,
      remainingLabel: "Unlimited",
      totalLabel: "Unlimited",
      expiresAt: usage.expires_at ?? usage.expiredAt,
      lastSyncedAt: usage.last_synced_at
    };
  }

  const total = firstNumber(usage.data_total_mb, usage.total);
  const remaining = firstNumber(usage.data_remaining_mb, usage.remaining);
  const usedPercent =
    total > 0 ? Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100))) : 0;

  return {
    available: true,
    unlimited: false,
    usedPercent,
    remainingLabel: formatMegabytes(remaining),
    totalLabel: formatMegabytes(total),
    expiresAt: usage.expires_at ?? usage.expiredAt,
    lastSyncedAt: usage.last_synced_at
  };
}

/** "just now", "5 minutes ago", "2 hours ago", "3 days ago". Null without a usable date. */
export function formatRelativeTime(value: string | null | undefined, now: number = Date.now()): string | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/** An LPA activation string split into the SM-DP+ address and the activation code. */
export type LpaParts = { address: string; code: string | null };

/** "LPA:1$smdp.example.com$CODE" -> address + code. Null when it is not an LPA string. */
export function parseLpa(value: string | null | undefined): LpaParts | null {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.toUpperCase().startsWith("LPA:")) return null;
  const parts = trimmed.split("$");
  const address = parts[1]?.trim();
  if (!address) return null;
  return { address, code: parts[2]?.trim() || null };
}

export type InstallPlatform = "ios" | "android";

export type InstallGuide = {
  platform: InstallPlatform;
  /** "iOS 17.4+", "Android" ... */
  title: string;
  qrSteps: string[];
  manualSteps: string[];
  manualLpa: string | null;
  networkSteps: string[];
  apnType: string | null;
  apnValue: string | null;
  /** Whether the provider says data roaming must be on. Null when it says nothing. */
  roaming: boolean | null;
};

export type InstallInstructions = {
  guides: InstallGuide[];
  /** Older {title, body} shape, shown as plain text when no platform guides exist. */
  generic: { title: string; body: string }[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Airalo sends steps as {"1": "...", "2": "..."}; an array is accepted too. */
function readSteps(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asString).filter((step): step is string => step !== null);
  const record = asRecord(value);
  if (!record) return [];
  return Object.keys(record)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => asString(record[key]))
    .filter((step): step is string => step !== null);
}

function readGuide(platform: InstallPlatform, raw: unknown): InstallGuide | null {
  const entry = asRecord(raw);
  if (!entry) return null;
  const qr = asRecord(entry.installation_via_qr_code);
  const manual = asRecord(entry.installation_manual);
  const network = asRecord(entry.network_setup);
  const base = platform === "ios" ? "iOS" : "Android";
  const version = asString(entry.version);
  const model = asString(entry.model);
  const guide: InstallGuide = {
    platform,
    title: version ? `${base} ${version}` : model ? `${base} · ${model}` : base,
    qrSteps: readSteps(qr?.steps),
    manualSteps: readSteps(manual?.steps),
    manualLpa: asString(manual?.smdp_address_and_activation_code) ?? asString(qr?.qr_code_data),
    networkSteps: readSteps(network?.steps),
    apnType: asString(network?.apn_type),
    apnValue: asString(network?.apn_value),
    roaming: typeof network?.is_roaming === "boolean" ? network.is_roaming : null
  };
  const hasContent =
    guide.qrSteps.length > 0 ||
    guide.manualSteps.length > 0 ||
    guide.networkSteps.length > 0 ||
    guide.apnValue !== null;
  return hasContent ? guide : null;
}

/**
 * GET /orders/:id/instructions passes Airalo's payload through:
 * `{available, iccid, instructions: {language, ios: [...], android: [...]}}`.
 * Every field may be missing, so each is read defensively.
 */
export function parseInstallInstructions(raw: unknown): InstallInstructions {
  const result: InstallInstructions = { guides: [], generic: [] };
  const top = asRecord(raw);
  if (!top) return result;

  if (Array.isArray(top.instructions)) {
    for (const item of top.instructions) {
      const record = asRecord(item);
      const body = asString(record?.body);
      if (body) result.generic.push({ title: asString(record?.title) ?? "Install your eSIM", body });
    }
    return result;
  }

  const nested = asRecord(top.instructions);
  if (!nested) return result;
  for (const platform of ["ios", "android"] as const) {
    const entries = Array.isArray(nested[platform]) ? (nested[platform] as unknown[]) : [];
    for (const entry of entries) {
      const guide = readGuide(platform, entry);
      if (guide) result.guides.push(guide);
    }
  }
  return result;
}
