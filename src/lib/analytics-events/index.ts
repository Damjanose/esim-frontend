import { readConsentFromDocument } from "@/lib/consent";
import {
  ANALYTICS_CONTRACT_VERSION,
  FLUSH_INTERVAL_MS,
  type ClientEvent,
  type DeviceType,
  type EventBatch
} from "./contract";
import { cleanCampaign, type CleanCampaign } from "./campaign";
import { createEventQueue, type SendOutcome } from "./queue";
import { sanitizeSearchTerm } from "./sanitize";
import { getSessionId, getVisitorId, SESSION_STORAGE_KEY, VISITOR_STORAGE_KEY, type KeyValueStore } from "./visitor";

type EventInput = ClientEvent extends infer E ? (E extends ClientEvent ? Omit<E, "at"> : never) : never;
export type { EventInput };

const ENDPOINT = "/bff/events";
/** Campaign and referrer of the landing page of one session. Keyed by session id, so a new session never inherits it. */
const LANDING_KEY = "esim2you_analytics_landing";

const MEMORY_STORE: KeyValueStore = { getItem: () => null, setItem: () => undefined };

type Landing = {
  sessionId: string;
  campaign: CleanCampaign | null;
  referrerDomain: string | null;
};

/** The landing of the current page load, so a later URL change (client navigation) cannot lose it. */
let landingCache: Landing | null = null;

function browserStore(kind: "localStorage" | "sessionStorage"): KeyValueStore {
  try {
    return window[kind];
  } catch {
    return MEMORY_STORE;
  }
}

function storedLanding(): Landing | null {
  try {
    const raw = browserStore("sessionStorage").getItem(LANDING_KEY);
    return raw ? (JSON.parse(raw) as Landing) : null;
  } catch {
    return null;
  }
}

/** Reads utm values and the referrer from the landing page, once per session. Consent is checked by the caller. */
function captureLanding(sessionId: string): void {
  if (landingCache?.sessionId === sessionId) return;
  const stored = storedLanding();
  if (stored?.sessionId === sessionId) {
    landingCache = stored;
    return;
  }
  const params = new URLSearchParams(window.location.search);
  let referrerDomain: string | null = null;
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) referrerDomain = host.slice(0, 253);
    }
  } catch {
    referrerDomain = null;
  }
  landingCache = {
    sessionId,
    campaign: cleanCampaign({
      source: params.get("utm_source"),
      medium: params.get("utm_medium"),
      campaign: params.get("utm_campaign")
    }),
    referrerDomain
  };
  try {
    browserStore("sessionStorage").setItem(LANDING_KEY, JSON.stringify(landingCache));
  } catch {
    // Blocked storage: the landing stays in memory for this page load.
  }
}

/** The landing that belongs to this session, or null when the session has none yet. */
function landingFor(sessionId: string): Landing | null {
  if (landingCache?.sessionId === sessionId) return landingCache;
  const stored = storedLanding();
  return stored?.sessionId === sessionId ? stored : null;
}

/** Detail that is per-page: the device type, read when the batch is built. */
export function detectDeviceType(): DeviceType {
  try {
    const coarse = window.matchMedia("(pointer:coarse)").matches;
    const width = window.innerWidth;
    if (coarse && width < 768) return "phone";
    if (coarse && width < 1100) return "tablet";
  } catch {
    // No media query support: report a computer.
  }
  return "computer";
}

function buildEnvelope(events: ClientEvent[]): EventBatch | null {
  const consent = readConsentFromDocument();
  const allowed = consent?.analytics === true;
  const visitorId = getVisitorId(browserStore("localStorage"), allowed);
  const sessionId = getSessionId(browserStore("sessionStorage"), allowed, Date.now());
  if (!visitorId || !sessionId) return null;
  const landing = landingFor(sessionId);
  return {
    contractVersion: ANALYTICS_CONTRACT_VERSION,
    visitorId,
    sessionId,
    platform: "web",
    appVersion: null,
    locale: navigator.language?.slice(0, 35) || null,
    utcOffsetMinutes: -new Date().getTimezoneOffset(),
    deviceType: detectDeviceType(),
    campaign: landing?.campaign ?? null,
    referrerDomain: landing?.referrerDomain ?? null,
    events
  };
}

async function send(events: ClientEvent[]): Promise<SendOutcome> {
  const envelope = buildEnvelope(events);
  // Without consent there is nothing to send: treat the batch as sent so it is dropped.
  if (!envelope) return 200;
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      keepalive: true
    });
    return response.status;
  } catch {
    return null;
  }
}

function beacon(events: ClientEvent[]): boolean {
  const envelope = buildEnvelope(events);
  if (!envelope) return true;
  try {
    if (typeof navigator.sendBeacon !== "function") return false;
    return navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(envelope)], { type: "application/json" }));
  } catch {
    return false;
  }
}

let queue: ReturnType<typeof createEventQueue> | null = null;

function getQueue() {
  if (!queue) {
    queue = createEventQueue({ send, beacon });
    const flushOnHide = () => queue?.flushOnHide();
    window.addEventListener("pagehide", flushOnHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushOnHide();
    });
    window.setInterval(() => void queue?.flush(), FLUSH_INTERVAL_MS);
  }
  return queue;
}

/**
 * Removes the stored ids and landing once analytics consent is no longer given. Called on
 * every page, so a withdrawal takes effect at once. Does nothing while consent is given.
 */
export function syncAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  if (readConsentFromDocument()?.analytics === true) return;
  landingCache = null;
  for (const [store, key] of [
    [browserStore("localStorage"), VISITOR_STORAGE_KEY],
    [browserStore("sessionStorage"), SESSION_STORAGE_KEY],
    [browserStore("sessionStorage"), LANDING_KEY]
  ] as const) {
    try {
      (store as Storage).removeItem(key);
    } catch {
      // Blocked storage has nothing to remove.
    }
  }
}

/**
 * Public API, frozen. Queues one event for the website's analytics. Does nothing without
 * analytics consent and never on admin (/x*) pages. The event goes to /bff/events in batches.
 */
export function trackWebEvent(event: EventInput): void {
  if (typeof window === "undefined") return;
  if (/^\/x[a-z]/i.test(window.location.pathname)) return;
  if (readConsentFromDocument()?.analytics !== true) {
    syncAnalyticsConsent();
    return;
  }

  const sessionId = getSessionId(browserStore("sessionStorage"), true, Date.now());
  if (sessionId) captureLanding(sessionId);

  const at = new Date().toISOString();
  if (event.type === "search") {
    const term = sanitizeSearchTerm(event.searchTerm);
    if (term === null) return;
    getQueue().enqueue({ ...event, searchTerm: term, at } as ClientEvent);
    return;
  }
  getQueue().enqueue({ ...event, at } as ClientEvent);
}
