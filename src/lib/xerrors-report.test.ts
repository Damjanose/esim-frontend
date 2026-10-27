import { describe, expect, it } from "vitest";
import {
  buildBackendCurl,
  buildFullReport,
  describeEmailSource,
  publicApiBase,
  type AdminErrorEvent
} from "./xerrors-report";

function makeEvent(overrides: Partial<AdminErrorEvent> = {}): AdminErrorEvent {
  return {
    id: "evt_1",
    requestId: "req_12345678",
    userEmail: "traveler@example.com",
    method: "POST",
    path: "/payments/provision",
    statusCode: 502,
    severity: "critical",
    area: "payments",
    message: "Provider unavailable",
    authorizationHeader: "Bearer tok.en.value",
    originalRequestBody: { payment_id: "pay_1" },
    safeRequestBody: { payment_id: "[safe]" },
    safeQuery: null,
    backendResponse: { status: "error", message: "Provider unavailable" },
    relatedPaymentReference: "pay_1",
    resolvedAt: null,
    createdAt: "2026-10-26T10:00:00.000Z",
    updatedAt: "2026-10-26T10:00:00.000Z",
    source: "client-mobile",
    kind: "client_error",
    platform: "ios",
    appVersion: "1.4.2",
    deviceId: "dev-1",
    osVersion: "18.1",
    deviceModel: "iPhone15,2",
    screen: "PlanCheckout",
    scenario: "purchase_plan",
    stage: "provision",
    clientIp: "203.0.113.9",
    clientIpSource: "x-client-ip",
    userEmailSource: "verified_token",
    ...overrides
  } as AdminErrorEvent;
}

describe("publicApiBase", () => {
  it("is the public site host plus /api, never an internal address", () => {
    expect(publicApiBase()).toBe("https://esim.uplisoft.com/api");
    expect(publicApiBase()).not.toContain("127.0.0.1");
  });
});

describe("buildBackendCurl", () => {
  it("targets the public backend API with the real stored token", () => {
    const curl = buildBackendCurl(makeEvent());
    expect(curl).toContain("curl -X 'POST' 'https://esim.uplisoft.com/api/payments/provision'");
    expect(curl).toContain("-H 'Authorization: Bearer tok.en.value'");
    expect(curl).not.toContain("<user-token>");
  });

  it("adds the stored client headers", () => {
    const curl = buildBackendCurl(makeEvent());
    expect(curl).toContain("-H 'x-platform: ios'");
    expect(curl).toContain("-H 'x-app-version: 1.4.2'");
    expect(curl).toContain("-H 'x-device-id: dev-1'");
    expect(curl).toContain("-H 'x-request-id: req_12345678'");
  });

  it("omits headers that were not stored", () => {
    const curl = buildBackendCurl(makeEvent({ platform: null, appVersion: null, deviceId: null, requestId: "short" }));
    expect(curl).not.toContain("x-platform");
    expect(curl).not.toContain("x-app-version");
    expect(curl).not.toContain("x-device-id");
    expect(curl).not.toContain("x-request-id");
  });

  it("never lets a malicious method reach the shell", () => {
    const curl = buildBackendCurl(makeEvent({ method: "$(touch /tmp/pwn)" }));
    expect(curl).toContain("curl -X 'GET'");
    expect(curl).not.toContain("$(");
    expect(curl).not.toContain("touch");
  });

  it("falls back to a placeholder only when the token is missing", () => {
    const curl = buildBackendCurl(makeEvent({ authorizationHeader: null }));
    expect(curl).toContain("Authorization: Bearer <user-token>");
  });

  it("accepts a stored token without the Bearer prefix", () => {
    const curl = buildBackendCurl(makeEvent({ authorizationHeader: "raw-token" }));
    expect(curl).toContain("Authorization: Bearer raw-token");
  });

  it("prefers the original body and falls back to the safe one", () => {
    expect(buildBackendCurl(makeEvent())).toContain('"payment_id":"pay_1"');
    const fallback = buildBackendCurl(makeEvent({ originalRequestBody: null }));
    expect(fallback).toContain("[safe]");
  });

  it("sends no body for GET and does not double the /api prefix", () => {
    const curl = buildBackendCurl(makeEvent({ method: "GET", path: "/api/packages", safeQuery: { country: "FR" } }));
    expect(curl).toContain("'https://esim.uplisoft.com/api/packages?country=FR'");
    expect(curl).not.toContain("--data");
  });

  it("shell-quotes single quotes in values", () => {
    const curl = buildBackendCurl(makeEvent({ originalRequestBody: { note: "it's" } }));
    expect(curl).toContain("'\\''");
  });
});

describe("describeEmailSource", () => {
  it("marks hint-only sources as unverified", () => {
    expect(describeEmailSource("verified_token")).toEqual({ label: "verified", unverified: false });
    expect(describeEmailSource("token_unverified").unverified).toBe(true);
    expect(describeEmailSource("client_header").unverified).toBe(true);
    expect(describeEmailSource("body").unverified).toBe(true);
    expect(describeEmailSource(null).unverified).toBe(false);
  });
});

describe("buildFullReport", () => {
  it("includes user, device, flow, payload, response, trail, stack and cURL", () => {
    const report = buildFullReport(
      makeEvent({
        stack: "Error: boom\n at x",
        noEmailReason: null,
        apiCalls: [
          { method: "POST", url: "https://esim.uplisoft.com/api/payments/confirm", status: 200, durationMs: 120, requestId: "r1" }
        ]
      })
    );
    expect(report).toContain("# Error report evt_1");
    expect(report).toContain("traveler@example.com");
    expect(report).toContain("verified_token");
    expect(report).toContain("ios");
    expect(report).toContain("1.4.2");
    expect(report).toContain("iPhone15,2");
    expect(report).toContain("PlanCheckout");
    expect(report).toContain("purchase_plan");
    expect(report).toContain("203.0.113.9");
    expect(report).toContain("req_12345678");
    expect(report).toContain("Provider unavailable");
    expect(report).toContain("API call trail");
    expect(report).toContain("/payments/confirm");
    expect(report).toContain("Error: boom");
    expect(report).toContain("curl -X 'POST'");
  });

  it("reports the no-email reason when there is no email", () => {
    const report = buildFullReport(makeEvent({ userEmail: null, noEmailReason: "token_expired", userEmailSource: "none" }));
    expect(report).toContain("token_expired");
  });
});
