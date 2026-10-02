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
      expiresAt: usage.expiredAt
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
    expiresAt: usage.expiredAt
  };
}
