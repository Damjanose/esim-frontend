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
  remaining?: number;
  total?: number;
  expiredAt?: string;
};

export type UsageSummary =
  | {
      available: true;
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

function formatMegabytes(value: number): string {
  if (value >= 1024) {
    const gb = value / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${Math.round(value)} MB`;
}

/**
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

  const total = typeof usage.total === "number" ? usage.total : 0;
  const remaining = typeof usage.remaining === "number" ? usage.remaining : 0;
  const usedPercent = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;

  return {
    available: true,
    usedPercent,
    remainingLabel: formatMegabytes(remaining),
    totalLabel: formatMegabytes(total),
    expiresAt: usage.expiredAt
  };
}
