import { Agent, fetch as undiciFetch } from "undici";
import packageJson from "../../package.json";
import { readEmailHintFromToken } from "./session-identity";

const DEFAULT_BACKEND_API_URL = "https://esim.uplisoft.com/api";

/**
 * Single source of truth for the backend base URL. Previously duplicated across
 * route handlers with subtly different development fallbacks.
 *
 * The hosted backend is the default in every environment, including `next dev`,
 * so local pages hit real data instead of silently falling back to a backend on
 * this machine. To develop against a local backend, set `BACKEND_API_URL`
 * explicitly (e.g. `BACKEND_API_URL=http://127.0.0.1:4000/api pnpm dev`).
 */
export function getBackendApiUrl(): string {
  const configuredUrl = (
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return DEFAULT_BACKEND_API_URL;
}

export type BackendResult<T> =
  | { ok: true; data: T }
  /** `payload` carries backend-specific error extras, e.g. `retryAfterSeconds` on 429. */
  | { ok: false; status: number; message: string; payload?: Record<string, unknown> };

export type BackendRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  next?: { revalidate?: number; tags?: string[] };
  /**
   * For calls that legitimately run for minutes (trip-plan generation and edits).
   * Node's global fetch gives up after 300s without response headers, so these go
   * through undici's own fetch with an Agent whose header/body timeouts match.
   */
  timeoutMs?: number;
  /**
   * The visitor's IP, forwarded as X-Client-IP (with the shared X-BFF-Key, without
   * which the backend ignores it) so per-IP rate limits see the visitor and not
   * this server. Only set it for public endpoints.
   */
  clientIp?: string;
  /** The visitor's browser User-Agent, forwarded as x-client-user-agent (this server's own UA is useless). */
  clientUserAgent?: string;
  /** The visitor's approximate location (see getClientGeo). Sent only with the BFF key, like clientIp. */
  clientGeo?: ClientGeo;
  /** Unverified email hint (x-user-email). Defaults to the address inside `token`. */
  userEmail?: string;
};

/** Web build identity sent as x-app-version: an explicit env value, else a git sha, else package.json. */
export function getAppVersion(): string {
  const explicit = (
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.APP_VERSION ??
    process.env.GIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    ""
  ).trim();
  return (explicit || packageJson.version).slice(0, 64);
}

type MetaOptions = Pick<BackendRequest, "token" | "clientUserAgent" | "userEmail"> & {
  /** Cached (`next.revalidate`) calls get only the stable headers. */
  cached?: boolean;
};

const HEADER_SAFE_VALUE = /^[\x21-\x7e]+$/;

/**
 * Headers the backend reads on every request (client meta for request logs and
 * /xerrors). Invariant: x-platform / x-client-source / x-app-version are stable
 * and go on every call; x-request-id, x-user-email and x-client-user-agent vary
 * per call/visitor and are added ONLY to uncached calls, because Next's fetch
 * data cache keys on request headers and these would defeat every revalidate cache.
 * x-user-email is printable ASCII only (Headers.set throws on anything else), and
 * the whole thing is try/catch so a bad hint can never fail the call.
 */
export function applyClientMetaHeaders(
  headers: Headers,
  { token, clientUserAgent, userEmail, cached = false }: MetaOptions = {}
) {
  try {
    headers.set("x-platform", "web");
    headers.set("x-client-source", "web");
    headers.set("x-app-version", getAppVersion());
    if (cached) return;
    headers.set("x-request-id", crypto.randomUUID());
    const ua = clientUserAgent?.replace(/[\r\n]+/g, " ").trim().slice(0, 300);
    if (ua && HEADER_SAFE_VALUE.test(ua.replace(/ /g, "_"))) headers.set("x-client-user-agent", ua);
    const email = userEmail?.trim().toLowerCase() || readEmailHintFromToken(token);
    if (email && email.length <= 254 && HEADER_SAFE_VALUE.test(email)) headers.set("x-user-email", email);
  } catch {
    // client meta is best effort
  }
}

/** The visitor's browser User-Agent for a BFF request, to pass as `clientUserAgent`. */
export function getClientUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent")?.trim() || undefined;
}

/** Approximate visitor location from Cloudflare's cf-* headers. Never coordinates or postal codes. */
export type ClientGeo = {
  country: string | null;
  regionCode: string | null;
  region: string | null;
  city: string | null;
};

/**
 * Node reads header bytes as latin1, so UTF-8 "Tiranë" arrives as "TiranÃ«". Turn it back into
 * UTF-8 when that decodes cleanly. A value that does not decode (already right, or not UTF-8)
 * is kept as it is.
 */
function repairLatin1(value: string): string {
  const decoded = Buffer.from(value, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? value : decoded;
}

/** Repairs, trims and caps a location value, then percent-encodes it. The backend decodes the four x-client-* headers. */
function geoValue(value: string | null, max: number): string | null {
  const trimmed = value === null ? "" : repairLatin1(value).trim().slice(0, max);
  return trimmed ? encodeURIComponent(trimmed) : null;
}

/**
 * The visitor's location for a BFF request, read from their own cf-* headers. Each value
 * is percent-encoded (encodeURIComponent), so non-ASCII names such as "Tiranë" survive
 * as headers. The backend decodes them.
 */
export function getClientGeo(request: Request): ClientGeo {
  const header = (name: string) => request.headers.get(name);
  return {
    country: geoValue(header("cf-ipcountry"), 2),
    regionCode: geoValue(header("cf-region-code"), 10),
    region: geoValue(header("cf-region"), 80),
    city: geoValue(header("cf-ipcity"), 80)
  };
}

/**
 * The visitor's IP for a BFF request. Production sits behind Cloudflare, which sets
 * CF-Connecting-IP. Otherwise nginx appends the peer address to X-Forwarded-For, so
 * the LAST entry is the one a client can't forge; X-Real-IP wins when set.
 */
export function getClientIp(request: Request): string | undefined {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for");
  const last = forwarded?.split(",").pop()?.trim();
  return last || undefined;
}

const longAgents = new Map<number, Agent>();

function longFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  let dispatcher = longAgents.get(timeoutMs);
  if (!dispatcher) {
    dispatcher = new Agent({ headersTimeout: timeoutMs, bodyTimeout: timeoutMs });
    longAgents.set(timeoutMs, dispatcher);
  }
  return undiciFetch(url, {
    method: init.method,
    headers: init.headers as Record<string, string> | Headers,
    body: init.body as string | undefined,
    dispatcher
  }) as unknown as Promise<Response>;
}

type BackendEnvelope<T> = {
  status?: string;
  data?: T;
  error?: string;
  message?: string;
};

const BUILD_FETCH_TIMEOUT_MS = 15_000;

const UNREACHABLE_MESSAGE = "We could not reach the eSIM service. Please try again.";

export async function backendFetch<T>(
  path: string,
  { method = "GET", body, token, next, timeoutMs, clientIp, clientUserAgent, userEmail, clientGeo }: BackendRequest = {}
): Promise<BackendResult<T>> {
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  applyClientMetaHeaders(headers, { token, clientUserAgent, userEmail, cached: Boolean(next) });
  const bffKey = process.env.BFF_SHARED_SECRET?.trim();
  if (bffKey && (clientIp || clientGeo)) {
    if (clientIp) headers.set("X-Client-IP", clientIp);
    headers.set("X-BFF-Key", bffKey);
  }
  if (clientGeo && bffKey) {
    if (clientGeo.country) headers.set("x-client-country", clientGeo.country);
    if (clientGeo.regionCode) headers.set("x-client-region-code", clientGeo.regionCode);
    if (clientGeo.region) headers.set("x-client-region", clientGeo.region);
    if (clientGeo.city) headers.set("x-client-city", clientGeo.city);
  }

  let response: Response;
  try {
    const requestInit: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(next ? { next } : { cache: "no-store" })
    };
    if (!timeoutMs && process.env.NEXT_PHASE === "phase-production-build") {
      // Prerendering ~190 pages fans out to the live API, and Node's default
      // wait is 300s, so one stalled response could hold a page past Next's
      // 60s limit and trigger retries. Cap it at build time only (the page
      // falls back and ISR refreshes it); runtime calls are unchanged.
      requestInit.signal = AbortSignal.timeout(BUILD_FETCH_TIMEOUT_MS);
    }
    const url = `${getBackendApiUrl()}${path}`;
    response = timeoutMs ? await longFetch(url, requestInit, timeoutMs) : await fetch(url, requestInit);
  } catch {
    return { ok: false, status: 502, message: UNREACHABLE_MESSAGE };
  }

  let payload: BackendEnvelope<T>;
  try {
    payload = (await response.json()) as BackendEnvelope<T>;
  } catch {
    return { ok: false, status: 502, message: UNREACHABLE_MESSAGE };
  }

  if (!response.ok || payload.status === "error") {
    return {
      ok: false,
      status: response.ok ? 400 : response.status,
      message: payload.error ?? payload.message ?? "Something went wrong.",
      payload: payload as Record<string, unknown>
    };
  }

  return { ok: true, data: (payload.data ?? ({} as T)) as T };
}

/**
 * Origin of the Express process (no `/api` suffix). Used by the admin support
 * inbox Socket.IO client — the one documented exception to "browser never talks
 * to Express directly". REST still goes through BFF.
 */
export function getBackendOrigin(): string {
  return getBackendApiUrl().replace(/\/api\/?$/, "");
}

export async function backendFetchFormData<T>(
  path: string,
  { token, formData }: { token?: string; formData: FormData }
): Promise<BackendResult<T>> {
  const headers = new Headers({ Accept: "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  applyClientMetaHeaders(headers, { token });

  let response: Response;
  try {
    response = await fetch(`${getBackendApiUrl()}${path}`, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store"
    });
  } catch {
    return { ok: false, status: 502, message: UNREACHABLE_MESSAGE };
  }

  let payload: BackendEnvelope<T>;
  try {
    payload = (await response.json()) as BackendEnvelope<T>;
  } catch {
    return { ok: false, status: 502, message: UNREACHABLE_MESSAGE };
  }

  if (!response.ok || payload.status === "error") {
    return {
      ok: false,
      status: response.ok ? 400 : response.status,
      message: payload.error ?? payload.message ?? "Something went wrong.",
      payload: payload as Record<string, unknown>
    };
  }

  return { ok: true, data: (payload.data ?? ({} as T)) as T };
}

export type BackendBinary = {
  buffer: ArrayBuffer;
  contentType: string;
  /** The backend's Content-Disposition (e.g. a PDF's attachment filename), when it sent one. */
  contentDisposition: string | null;
};

export async function backendFetchBinary(
  path: string,
  { token }: { token?: string } = {}
): Promise<BackendResult<BackendBinary>> {
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  applyClientMetaHeaders(headers, { token });

  let response: Response;
  try {
    response = await fetch(`${getBackendApiUrl()}${path}`, {
      headers,
      cache: "no-store"
    });
  } catch {
    return { ok: false, status: 502, message: UNREACHABLE_MESSAGE };
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  if (!response.ok) {
    let message = UNREACHABLE_MESSAGE;
    try {
      const payload = (await response.json()) as BackendEnvelope<unknown>;
      message = payload.error ?? payload.message ?? message;
    } catch {
      // Keep the generic unreachable copy when the body is not JSON.
    }
    return { ok: false, status: response.status, message };
  }

  try {
    const buffer = await response.arrayBuffer();
    return {
      ok: true,
      data: { buffer, contentType, contentDisposition: response.headers.get("content-disposition") }
    };
  } catch {
    return { ok: false, status: 502, message: UNREACHABLE_MESSAGE };
  }
}
