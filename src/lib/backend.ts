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
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  token?: string;
};

type BackendEnvelope<T> = {
  status?: string;
  data?: T;
  error?: string;
  message?: string;
};

const UNREACHABLE_MESSAGE = "We could not reach the eSIM service. Please try again.";

export async function backendFetch<T>(
  path: string,
  { method = "GET", body, token }: BackendRequest = {}
): Promise<BackendResult<T>> {
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getBackendApiUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
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
