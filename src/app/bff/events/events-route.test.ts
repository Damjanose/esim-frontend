import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_TOKEN_COOKIE } from "@/lib/adminTokenCookie";
import { CONSENT_COOKIE_NAME, CONSENT_VERSION } from "@/lib/consent";
import { ACCESS_COOKIE } from "@/lib/session";
import { POST } from "./route";

const originalEnv = { ...process.env };
const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const BATCH = {
  contractVersion: 1,
  visitorId: "visitor-abc-123",
  sessionId: "session-abc-123",
  platform: "web",
  events: [{ type: "screen_view", at: "2026-11-26T10:00:00Z", screen: "/esim/[slug]", destination: "united-states" }]
};

function consentCookie(analytics: boolean) {
  return `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify({ version: CONSENT_VERSION, analytics, marketing: false }))}`;
}

function post(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("https://esim.uplisoft.com/bff/events", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": SAFARI, ...headers },
    body
  });
}

function backendOk() {
  return vi.fn(async () => new Response(JSON.stringify({ status: "success", data: { accepted: 1, dropped: 0 } }), { status: 200 }));
}

beforeEach(() => {
  process.env = { ...originalEnv, BACKEND_API_URL: "https://backend.test/api", BFF_SHARED_SECRET: "bff-secret" };
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

describe("POST /bff/events", () => {
  it("rejects a foreign Origin without calling the backend", async () => {
    const fetchMock = backendOk();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(post(JSON.stringify(BATCH), { origin: "https://evil.example", cookie: consentCookie(true) }));
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 413 for a body over 16 KB", async () => {
    const fetchMock = backendOk();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(post("x".repeat(17 * 1024), { cookie: consentCookie(true) }));
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 204 without calling the backend when the consent cookie is missing", async () => {
    const fetchMock = backendOk();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(post(JSON.stringify(BATCH)));
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 204 without calling the backend when analytics consent is false", async () => {
    const fetchMock = backendOk();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(post(JSON.stringify(BATCH), { cookie: consentCookie(false) }));
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 204 without calling the backend when an admin is signed in on this browser", async () => {
    const fetchMock = backendOk();
    vi.stubGlobal("fetch", fetchMock);
    const cookie = `${consentCookie(true)}; ${ADMIN_TOKEN_COOKIE}=admin-token`;
    const response = await POST(post(JSON.stringify(BATCH), { cookie }));
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 204 without calling the backend for a bot user agent", async () => {
    const fetchMock = backendOk();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(post(JSON.stringify(BATCH), { cookie: consentCookie(true), "user-agent": "Googlebot/2.1" }));
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards to /analytics/events with the visitor's IP, location and the session token", async () => {
    const fetchMock = backendOk();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      post(JSON.stringify(BATCH), {
        cookie: `${consentCookie(true)}; ${ACCESS_COOKIE}=access-token`,
        "cf-connecting-ip": "203.0.113.7",
        "cf-ipcountry": "AL",
        "cf-region-code": "TR",
        "cf-iplatitude": "41.3"
      })
    );
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.test/api/analytics/events");
    expect(init.method).toBe("POST");
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(headers.get("X-Client-IP")).toBe("203.0.113.7");
    expect(headers.get("X-BFF-Key")).toBe("bff-secret");
    expect(headers.get("x-client-country")).toBe("AL");
    expect(headers.get("x-client-region-code")).toBe("TR");
    expect(JSON.parse(String(init.body))).toEqual(BATCH);
  });

  it("retries once without the token when the backend rejects it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "error", message: "expired" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "success", data: { accepted: 1, dropped: 0 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(post(JSON.stringify(BATCH), { cookie: `${consentCookie(true)}; ${ACCESS_COOKIE}=stale` }));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const second = (fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1];
    expect((second.headers as Headers).get("Authorization")).toBeNull();
  });

  it("passes a backend 429 back so the client keeps the batch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ status: "error", message: "slow down" }), { status: 429 }))
    );
    const response = await POST(post(JSON.stringify(BATCH), { cookie: consentCookie(true) }));
    expect(response.status).toBe(429);
  });
});
