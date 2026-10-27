/**
 * Web error reporting. Browser code posts to /bff/client-errors (never the
 * backend directly); server route handlers build the same payload with
 * buildClientErrorPayload and send it with backendFetch.
 *
 * Reporting must never break the page it is reporting on: every entry point
 * swallows its own failures.
 */

export const REFERENCE_ID_PATTERN = /^[A-Za-z0-9_.:-]{8,100}$/;

export type ClientErrorKind = "client_error" | "crash";

export type ClientErrorInput = {
  kind?: ClientErrorKind;
  scenario?: string;
  stage?: string;
  screen?: string;
  errorName?: string;
  message: string;
  stack?: string;
  referenceId?: string;
  appVersion?: string;
  userEmail?: string;
  failedRequest?: {
    method?: string;
    url?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: unknown;
    status?: number;
    response?: unknown;
    requestId?: string;
    durationMs?: number;
  };
  apiCalls?: unknown[];
  paymentReference?: string;
  orderId?: string;
  packageId?: string;
  iccid?: string;
  extra?: Record<string, unknown>;
};

export type ClientErrorPayload = ClientErrorInput & {
  source: "client-web";
  kind: ClientErrorKind;
  platform: "web";
  message: string;
  referenceId: string;
};

const MAX_MESSAGE = 2000;
const MAX_STACK = 8000;
const SENSITIVE_KEY = /card|cvv|cvc|securitycode|expir|\bpan\b|jwe|otp|password/i;
const LONG_DIGITS = /\b(?:\d[ -]?){13,19}\b/g;

/** Drops card-like keys at any depth and masks card-number-shaped digit runs in strings. */
export function scrubSensitive(value: unknown, depth = 0): unknown {
  if (depth > 6) return undefined;
  if (typeof value === "string") return value.replace(LONG_DIGITS, "[redacted]");
  if (Array.isArray(value)) return value.map((item) => scrubSensitive(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) continue;
      out[key] = scrubSensitive(inner, depth + 1);
    }
    return out;
  }
  return value;
}

export function generateReferenceId(): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `W-${Date.now().toString(36)}-${random}`.toUpperCase();
}

/** Strings only: a malformed payload field ({"stack":{"length":9}}) is dropped, never trusted. */
function str(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value ? truncate(value, max) : undefined;
}

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length > max ? value.slice(0, max) : value;
}

export function buildClientErrorPayload(input: ClientErrorInput): ClientErrorPayload {
  const raw = (input ?? {}) as Record<string, unknown>;
  const rawMessage = typeof raw.message === "string" ? raw.message : "";
  const message = truncate(String(scrubSensitive(rawMessage)), MAX_MESSAGE) || "Unknown error";
  const rawRef = typeof raw.referenceId === "string" ? raw.referenceId : "";
  const referenceId = REFERENCE_ID_PATTERN.test(rawRef) ? rawRef : generateReferenceId();

  const payload: ClientErrorPayload = {
    source: "client-web",
    kind: raw.kind === "crash" ? "crash" : "client_error",
    platform: "web",
    message,
    referenceId
  };
  const scalar = (key: "scenario" | "stage" | "screen" | "errorName" | "appVersion" | "userEmail" | "paymentReference" | "orderId" | "packageId" | "iccid", max: number) => {
    const value = str(raw[key], max);
    if (value) payload[key] = value;
  };
  scalar("scenario", 100);
  scalar("stage", 100);
  scalar("screen", 300);
  scalar("errorName", 100);
  scalar("appVersion", 64);
  scalar("userEmail", 254);
  scalar("paymentReference", 200);
  scalar("orderId", 200);
  scalar("packageId", 200);
  scalar("iccid", 64);
  const stack = str(raw.stack, MAX_STACK);
  if (stack) payload.stack = stack;
  const isObject = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);
  if (isObject(raw.failedRequest)) {
    payload.failedRequest = scrubSensitive(raw.failedRequest) as ClientErrorInput["failedRequest"];
  }
  if (Array.isArray(raw.apiCalls)) payload.apiCalls = (scrubSensitive(raw.apiCalls) as unknown[]).slice(0, 20);
  if (isObject(raw.extra)) payload.extra = scrubSensitive(raw.extra) as Record<string, unknown>;
  return payload;
}

export function fingerprintOf(
  input: Pick<ClientErrorInput, "kind" | "scenario" | "stage" | "errorName" | "message" | "paymentReference">
): string {
  return [input.kind ?? "client_error", input.scenario ?? "", input.stage ?? "", input.errorName ?? "", (input.message ?? "").slice(0, 160), input.paymentReference ?? ""].join("|");
}

const DEDUPE_WINDOW_MS = 60_000;
const reported = new Map<string, { referenceId: string; at: number }>();

export function resetReportedFingerprints(): void {
  reported.clear();
}

/**
 * Fire-and-forget. Returns the reference id immediately (generated client-side and
 * sent along), so the UI can show it before the request settles. The same failure
 * reported again within a minute returns the first reference id and sends nothing.
 */
export function reportClientError(input: ClientErrorInput): { referenceId: string } {
  try {
    const fingerprint = fingerprintOf(input);
    const now = Date.now();
    const previous = reported.get(fingerprint);
    if (previous && now - previous.at < DEDUPE_WINDOW_MS) {
      return { referenceId: previous.referenceId };
    }

    const payload = buildClientErrorPayload({
      ...input,
      screen: input.screen ?? (typeof window !== "undefined" ? window.location?.pathname : undefined)
    });
    reported.set(fingerprint, { referenceId: payload.referenceId, at: now });

    const body = JSON.stringify(payload);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon("/bff/client-errors", blob)) {
          return { referenceId: payload.referenceId };
        }
      }
    } catch {
      // fall through to fetch
    }

    try {
      void fetch("/bff/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => undefined);
    } catch {
      // never throw
    }
    return { referenceId: payload.referenceId };
  } catch {
    return { referenceId: generateReferenceId() };
  }
}
