/** One request to a marketing BFF route. Never throws: the caller gets ok, or a code to show. */
export type MarketingResult<T> = { ok: true; data: T } | { ok: false; code: string; unauthorized: boolean };

export async function marketingRequest<T>(
  token: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<MarketingResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" })
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store"
    });
    if (response.status === 401) return { ok: false, code: "unauthorized", unauthorized: true };
    const payload = (await response.json().catch(() => null)) as { status?: string; data?: T; message?: string } | null;
    if (!response.ok || payload?.status !== "success" || payload.data === undefined) {
      return { ok: false, code: payload?.message ?? "request_failed", unauthorized: false };
    }
    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, code: "network", unauthorized: false };
  }
}
