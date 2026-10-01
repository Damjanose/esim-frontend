import { describe, expect, it } from "vitest";
import { resolveQrSource, summariseUsage } from "./esim-install";

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
