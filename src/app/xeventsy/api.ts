// Client helpers for the /xeventsy admin pages. Every call goes through the
// BFF routes under /bff/admin/event-modals (the browser never calls the backend).
// Never throws: callers get an AdminResult they can branch on.

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

const BFF_BASE = "/bff/admin/event-modals";
const FALLBACK_MESSAGE = "Something went wrong.";
const NETWORK_MESSAGE = "Could not reach the server.";

async function send<T>(
  url: string,
  init: RequestInit,
  onUnauthorized?: () => void
): Promise<AdminResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    return { ok: false, status: 0, message: NETWORK_MESSAGE };
  }

  if (response.status === 401) onUnauthorized?.();

  const json = (await response.json().catch(() => null)) as
    | { status?: unknown; message?: unknown; data?: unknown }
    | null;

  if (response.ok && json?.status === "success") {
    return { ok: true, data: json.data as T };
  }

  const message =
    typeof json?.message === "string" && json.message.trim() !== ""
      ? json.message
      : FALLBACK_MESSAGE;
  return { ok: false, status: response.status, message };
}

export async function adminFetch<T>(
  path: string,
  opts: { token: string; method?: string; body?: unknown; onUnauthorized?: () => void }
): Promise<AdminResult<T>> {
  const hasBody = opts.body !== undefined;
  return send<T>(
    `${BFF_BASE}${path}`,
    {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {})
      },
      body: hasBody ? JSON.stringify(opts.body) : undefined
    },
    opts.onUnauthorized
  );
}

export async function adminUpload(
  file: File,
  opts: { token: string; onUnauthorized?: () => void }
): Promise<AdminResult<{ id: string; url: string }>> {
  const formData = new FormData();
  formData.append("file", file);
  return send<{ id: string; url: string }>(
    `${BFF_BASE}/images`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.token}` },
      body: formData
    },
    opts.onUnauthorized
  );
}
