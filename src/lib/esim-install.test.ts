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

  it("handles a fully used plan without dividing by zero", () => {
    const summary = summariseUsage({ available: true, remaining: 0, total: 0 });

    expect(summary).toMatchObject({ available: true, usedPercent: 0 });
  });
});
