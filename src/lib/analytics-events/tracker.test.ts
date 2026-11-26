import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_COOKIE_NAME, CONSENT_VERSION } from "@/lib/consent";
import { SESSION_STORAGE_KEY, VISITOR_STORAGE_KEY } from "./visitor";

const T0 = Date.UTC(2026, 10, 26, 10, 0, 0);
const THIRTY_ONE_MIN = 31 * 60 * 1000;
const LANDING_KEY = "esim2you_analytics_landing";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data
  };
}

type Listener = () => void;

let now = T0;
let location: { search: string; pathname: string; hostname: string };
let cookie: string;
let listeners: Record<string, Listener[]>;
let local: ReturnType<typeof memoryStorage>;
let session: ReturnType<typeof memoryStorage>;
let fetchMock: ReturnType<typeof vi.fn>;

function consent(analytics: boolean) {
  return `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify({ version: CONSENT_VERSION, analytics, marketing: false }))}`;
}

function sentBodies(): Array<{ sessionId: string; campaign: { source: string } | null }> {
  return fetchMock.mock.calls.map((call) => JSON.parse(String((call as unknown as [string, RequestInit])[1].body)));
}

async function flushNow() {
  for (const listener of listeners.pagehide ?? []) listener();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  now = T0;
  location = { search: "?utm_source=google&utm_medium=cpc&utm_campaign=spring", pathname: "/", hostname: "esim.uplisoft.com" };
  cookie = consent(true);
  listeners = {};
  local = memoryStorage();
  session = memoryStorage();
  fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.spyOn(Date, "now").mockImplementation(() => now);
  vi.stubGlobal("window", {
    location,
    innerWidth: 1200,
    localStorage: local,
    sessionStorage: session,
    matchMedia: () => ({ matches: false }),
    addEventListener: (type: string, fn: Listener) => {
      (listeners[type] ??= []).push(fn);
    },
    setInterval: () => 0
  });
  vi.stubGlobal("document", {
    referrer: "",
    visibilityState: "visible",
    addEventListener: () => undefined,
    get cookie() {
      return cookie;
    }
  });
  vi.stubGlobal("navigator", { language: "en-GB" });
  vi.stubGlobal("fetch", fetchMock);
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("campaign landing", () => {
  it("still sends the campaign after client navigation has dropped the utm query", async () => {
    const { trackWebEvent } = await import("./index");
    trackWebEvent({ type: "screen_view", screen: "/" });
    (window as unknown as { location: { search: string } }).location.search = "";
    await flushNow();
    expect(sentBodies()[0].campaign?.source).toBe("google");
  });

  it("does not carry a campaign into a new session", async () => {
    const { trackWebEvent } = await import("./index");
    trackWebEvent({ type: "screen_view", screen: "/" });
    await flushNow();
    expect(sentBodies()[0].campaign?.source).toBe("google");

    now = T0 + THIRTY_ONE_MIN;
    location.search = "";
    trackWebEvent({ type: "screen_view", screen: "/" });
    await flushNow();
    const bodies = sentBodies();
    expect(bodies[1].sessionId).not.toBe(bodies[0].sessionId);
    expect(bodies[1].campaign).toBeNull();
  });

  it("stores the landing for the session only with consent", async () => {
    cookie = consent(false);
    const { trackWebEvent } = await import("./index");
    trackWebEvent({ type: "screen_view", screen: "/" });
    expect(session.data.has(LANDING_KEY)).toBe(false);
  });
});

describe("consent withdrawn", () => {
  it("removes the visitor id and the session and landing keys", async () => {
    local.setItem(VISITOR_STORAGE_KEY, "visitor-abc-123");
    session.setItem(SESSION_STORAGE_KEY, JSON.stringify({ id: "session-abc-123", last: T0 }));
    session.setItem(LANDING_KEY, JSON.stringify({ sessionId: "session-abc-123", campaign: null, referrerDomain: null }));
    cookie = consent(false);
    const { syncAnalyticsConsent } = await import("./index");
    syncAnalyticsConsent();
    expect(local.data.has(VISITOR_STORAGE_KEY)).toBe(false);
    expect(session.data.has(SESSION_STORAGE_KEY)).toBe(false);
    expect(session.data.has(LANDING_KEY)).toBe(false);
  });

  it("keeps the stored ids while consent is given", async () => {
    local.setItem(VISITOR_STORAGE_KEY, "visitor-abc-123");
    const { syncAnalyticsConsent } = await import("./index");
    syncAnalyticsConsent();
    expect(local.data.get(VISITOR_STORAGE_KEY)).toBe("visitor-abc-123");
  });
});
