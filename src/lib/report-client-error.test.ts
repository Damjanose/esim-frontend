import { afterEach, describe, expect, it, vi } from "vitest";
import {
  REFERENCE_ID_PATTERN,
  buildClientErrorPayload,
  fingerprintOf,
  generateReferenceId,
  reportClientError,
  resetReportedFingerprints,
  scrubSensitive
} from "./report-client-error";

afterEach(() => {
  vi.unstubAllGlobals();
  resetReportedFingerprints();
});

describe("generateReferenceId", () => {
  it("matches the backend reference id pattern and is unique", () => {
    const a = generateReferenceId();
    const b = generateReferenceId();
    expect(a).toMatch(REFERENCE_ID_PATTERN);
    expect(a).not.toBe(b);
  });
});

describe("scrubSensitive", () => {
  it("drops card-like keys at any depth and redacts long digit runs", () => {
    const result = scrubSensitive({
      cardNumber: "4242424242424242",
      nested: { cvv: "123", securityCode: "999", expiration: "12/30", ok: "keep" },
      note: "paid with 4242 4242 4242 4242 today",
      list: [{ cvc: "1", fine: 1 }]
    }) as Record<string, unknown>;
    expect(JSON.stringify(result)).not.toContain("4242");
    expect(result.cardNumber).toBeUndefined();
    expect((result.nested as Record<string, unknown>).ok).toBe("keep");
    expect((result.nested as Record<string, unknown>).cvv).toBeUndefined();
    expect(result.note).toContain("[redacted]");
    expect(((result.list as unknown[])[0] as Record<string, unknown>).fine).toBe(1);
  });
});

describe("buildClientErrorPayload", () => {
  it("builds a client-web payload with a valid reference id and truncated fields", () => {
    const payload = buildClientErrorPayload({
      kind: "client_error",
      scenario: "purchase_plan_web",
      stage: "card",
      message: "x".repeat(5000),
      stack: "s".repeat(20000),
      paymentReference: "pay_1",
      extra: { cvv: "123", step: 2 }
    });
    expect(payload.source).toBe("client-web");
    expect(payload.platform).toBe("web");
    expect(payload.referenceId).toMatch(REFERENCE_ID_PATTERN);
    expect(payload.message.length).toBeLessThanOrEqual(2000);
    expect(payload.stack!.length).toBeLessThanOrEqual(8000);
    expect(payload.paymentReference).toBe("pay_1");
    expect(payload.extra).toEqual({ step: 2 });
    expect(JSON.stringify(payload).length).toBeLessThan(60 * 1024);
  });

  it("honors a supplied reference id only if it is valid", () => {
    expect(buildClientErrorPayload({ message: "m", referenceId: "abcdefgh12" }).referenceId).toBe("abcdefgh12");
    expect(buildClientErrorPayload({ message: "m", referenceId: "bad id!" }).referenceId).toMatch(REFERENCE_ID_PATTERN);
  });

  it("defaults to a placeholder message and client_error kind", () => {
    const payload = buildClientErrorPayload({ message: "" });
    expect(payload.message).toBe("Unknown error");
    expect(payload.kind).toBe("client_error");
  });
});

describe("fingerprintOf", () => {
  it("is stable for the same failure and differs across scenarios", () => {
    const a = { kind: "crash" as const, scenario: "s", stage: "t", errorName: "E", message: "boom" };
    expect(fingerprintOf(a)).toBe(fingerprintOf({ ...a }));
    expect(fingerprintOf(a)).not.toBe(fingerprintOf({ ...a, scenario: "other" }));
    // A retry on a new payment is a new failure, not a duplicate.
    expect(fingerprintOf({ ...a, paymentReference: "pay_1" })).not.toBe(
      fingerprintOf({ ...a, paymentReference: "pay_2" })
    );
  });
});

describe("reportClientError", () => {
  it("never throws and de-dupes identical failures", async () => {
    const fetchMock = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {});

    const first = reportClientError({ message: "boom", scenario: "s" });
    const second = reportClientError({ message: "boom", scenario: "s" });

    expect(first.referenceId).toBe(second.referenceId);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/bff/client-errors");
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe("POST");
  });

  it("uses sendBeacon when available", () => {
    const beacon = vi.fn(() => true);
    const fetchMock = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    vi.stubGlobal("fetch", fetchMock);

    reportClientError({ message: "beacon me" });

    expect(beacon).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("swallows transport failures", () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("fetch", () => {
      throw new Error("offline");
    });
    expect(() => reportClientError({ message: "x" })).not.toThrow();
  });
});
