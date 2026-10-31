import { describe, expect, it } from "vitest";
import {
  formatRelativeTime,
  parseInstallInstructions,
  parseLpa,
  resolveQrSource,
  summariseUsage
} from "./esim-install";

const base64Png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("resolveQrSource", () => {
  it("uses a hosted QR image directly", () => {
    expect(resolveQrSource("https://cdn.airalo.com/qr/abc.png")).toEqual({
      kind: "image",
      src: "https://cdn.airalo.com/qr/abc.png"
    });
  });

  it("wraps a bare base64 PNG in a data URI", () => {
    expect(resolveQrSource(base64Png)).toEqual({
      kind: "image",
      src: `data:image/png;base64,${base64Png}`
    });
  });

  it("passes an existing data URI through untouched", () => {
    const dataUri = `data:image/png;base64,${base64Png}`;

    expect(resolveQrSource(dataUri)).toEqual({ kind: "image", src: dataUri });
  });

  it("treats an LPA string as a manual activation code", () => {
    expect(resolveQrSource("LPA:1$smdp.example.com$ABC-123")).toEqual({
      kind: "activation",
      code: "LPA:1$smdp.example.com$ABC-123"
    });
  });

  it("reports nothing to show when the QR is missing", () => {
    expect(resolveQrSource("")).toEqual({ kind: "none" });
    expect(resolveQrSource(undefined)).toEqual({ kind: "none" });
  });
});

describe("summariseUsage", () => {
  it("reports remaining data when the provider has usage", () => {
    const summary = summariseUsage({
      available: true,
      remaining: 12288,
      total: 20480,
      expiredAt: "2026-09-12T00:00:00.000Z"
    });

    expect(summary).toMatchObject({
      available: true,
      usedPercent: 40,
      remainingLabel: "12 GB"
    });
  });

  it("explains why usage is missing instead of showing a misleading zero", () => {
    const summary = summariseUsage({
      available: false,
      reason: "no_iccid",
      message: "Usage is unavailable until the eSIM is provisioned."
    });

    expect(summary).toEqual({
      available: false,
      message: "Usage is unavailable until the eSIM is provisioned."
    });
  });

  it("falls back to a readable message when the provider gives no reason text", () => {
    const summary = summariseUsage({ available: false, reason: "provider_error" });

    expect(summary.available).toBe(false);
    if (summary.available) throw new Error("expected an unavailable summary");
    expect(summary.message.length).toBeGreaterThan(0);
  });

  it("reads the backend's usage shape (data_total_mb / data_remaining_mb)", () => {
    const summary = summariseUsage({
      available: true,
      data_total_mb: 10240,
      data_remaining_mb: 4096,
      is_unlimited: false
    });

    expect(summary).toEqual({
      available: true,
      unlimited: false,
      usedPercent: 60,
      remainingLabel: "4 GB",
      totalLabel: "10 GB",
      expiresAt: undefined
    });
  });

  it("reports an unlimited plan as unlimited, not as 0 MB of 0 MB", () => {
    // normalizeSimUsage zeroes both totals for an unlimited plan.
    const summary = summariseUsage({
      available: true,
      data_total_mb: 0,
      data_remaining_mb: 0,
      is_unlimited: true
    });

    expect(summary).toMatchObject({ available: true, unlimited: true, usedPercent: 0, remainingLabel: "Unlimited" });
  });

  it("keeps the used share between 0 and 100 when the provider over-reports what is left", () => {
    expect(summariseUsage({ available: true, data_total_mb: 1024, data_remaining_mb: 2048 })).toMatchObject({
      usedPercent: 0
    });
  });

  it("handles a fully used plan without dividing by zero", () => {
    const summary = summariseUsage({ available: true, remaining: 0, total: 0 });

    expect(summary).toMatchObject({ available: true, usedPercent: 0 });
  });
});

describe("summariseUsage freshness", () => {
  it("carries last_synced_at and prefers the provider expiry", () => {
    const summary = summariseUsage({
      available: true,
      data_total_mb: 1024,
      data_remaining_mb: 512,
      expiredAt: "2026-01-01T00:00:00.000Z",
      expires_at: "2026-02-01T00:00:00.000Z",
      last_synced_at: "2026-01-15T10:00:00.000Z"
    });
    expect(summary).toMatchObject({
      expiresAt: "2026-02-01T00:00:00.000Z",
      lastSyncedAt: "2026-01-15T10:00:00.000Z"
    });
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-10-01T12:00:00.000Z");
  it("reads naturally", () => {
    expect(formatRelativeTime("2026-10-01T11:59:40.000Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-10-01T11:55:00.000Z", now)).toBe("5 minutes ago");
    expect(formatRelativeTime("2026-10-01T10:00:00.000Z", now)).toBe("2 hours ago");
    expect(formatRelativeTime("2026-09-28T12:00:00.000Z", now)).toBe("3 days ago");
    expect(formatRelativeTime(undefined, now)).toBeNull();
    expect(formatRelativeTime("nope", now)).toBeNull();
  });
});

describe("parseLpa", () => {
  it("splits address and code", () => {
    expect(parseLpa("LPA:1$smdp.example.com$ABC-123")).toEqual({ address: "smdp.example.com", code: "ABC-123" });
    expect(parseLpa("LPA:1$smdp.example.com")).toEqual({ address: "smdp.example.com", code: null });
    expect(parseLpa("ABC")).toBeNull();
    expect(parseLpa(null)).toBeNull();
  });
});

describe("parseInstallInstructions", () => {
  it("reads Airalo's per-platform guides", () => {
    const parsed = parseInstallInstructions({
      available: true,
      instructions: {
        language: "EN",
        ios: [
          {
            version: "17.4+",
            installation_via_qr_code: { steps: { "2": "Scan", "1": "Open Settings" } },
            installation_manual: { steps: { "1": "Enter details" }, smdp_address_and_activation_code: "LPA:1$a.com$X" },
            network_setup: { steps: { "1": "Turn on Data Roaming" }, apn_type: "automatic", apn_value: "internet", is_roaming: true }
          }
        ],
        android: [{ installation_via_qr_code: { steps: ["Tap Add"] } }]
      }
    });
    expect(parsed.guides).toHaveLength(2);
    expect(parsed.guides[0]).toMatchObject({
      platform: "ios",
      title: "iOS 17.4+",
      qrSteps: ["Open Settings", "Scan"],
      manualLpa: "LPA:1$a.com$X",
      apnType: "automatic",
      apnValue: "internet",
      roaming: true
    });
    expect(parsed.guides[1]).toMatchObject({ platform: "android", title: "Android", qrSteps: ["Tap Add"], roaming: null });
  });

  it("is tolerant of missing and legacy shapes", () => {
    expect(parseInstallInstructions(null)).toEqual({ guides: [], generic: [] });
    expect(parseInstallInstructions({ available: true })).toEqual({ guides: [], generic: [] });
    expect(parseInstallInstructions({ instructions: [{ title: "T", body: "B" }] }).generic).toEqual([
      { title: "T", body: "B" }
    ]);
  });
});
