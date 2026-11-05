import { readConsentFromDocument } from "@/lib/consent";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1409444498012862";

const SCRIPT_ID = "meta-pixel-script";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  disablePushState?: boolean;
  loaded?: boolean;
  push?: unknown;
  queue?: unknown[];
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Admin routes are obfuscated `x*` paths and their URLs must never reach a third party. */
export function isAdminPath(pathname: string): boolean {
  return /^\/x[a-z]+(\/|$)/.test(pathname);
}

/** Loads the pixel once. Callers must already have checked marketing consent. */
export function installMetaPixel(): void {
  if (!META_PIXEL_ID || window.fbq) return;

  // Meta's official stub: fbevents.js replays the queue, and needs `arguments` objects.
  const fbq: Fbq = function () {
    if (fbq.callMethod) {
      // eslint-disable-next-line prefer-rest-params
      fbq.callMethod.apply(fbq, arguments as unknown as unknown[]);
    } else {
      // eslint-disable-next-line prefer-rest-params
      fbq.queue?.push(arguments);
    }
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  // MetaPixel.tsx sends each PageView; the automatic history tracking would double them
  // and would report a client-side navigation into an admin route.
  fbq.disablePushState = true;
  window.fbq = fbq;
  window._fbq = fbq;
  fbq("init", META_PIXEL_ID);

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.async = true;
    script.id = SCRIPT_ID;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
}

export function removeMetaPixel(): void {
  document.getElementById(SCRIPT_ID)?.remove();
  window.fbq = undefined;
  window._fbq = undefined;
}

/**
 * Sends a standard event, only with marketing consent; callers never check consent
 * themselves. `eventId` lets Meta dedupe against the same event from Conversions API.
 */
export function trackMetaEvent(name: string, params?: Record<string, unknown>, eventId?: string): void {
  if (typeof window === "undefined" || readConsentFromDocument()?.marketing !== true) return;
  installMetaPixel();
  if (eventId) window.fbq?.("track", name, params, { eventID: eventId });
  else if (params) window.fbq?.("track", name, params);
  else window.fbq?.("track", name);
}

/** `content_ids`/`value`/`currency` as Meta expects for a product event. */
export function metaProductParams(ids: string[], value: number, currency: string) {
  return { content_ids: ids, content_type: "product", value, currency };
}
