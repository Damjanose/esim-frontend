import { backendFetch, type BackendRequest } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/**
 * Trip-plan generation and edits run 2–5 minutes on the provider. The backend
 * keeps its socket open for 10 minutes; match that so the BFF never gives up first.
 */
export const ITINERARY_LONG_TIMEOUT_MS = 600_000;

/** One backend `/itineraries…` call with the browser's session, as a BFF JSON response. */
export async function proxyItinerary(
  request: Request,
  path: string,
  init: Omit<BackendRequest, "token"> = {}
) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>(`/itineraries${path}`, { ...init, token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, attempt.code ? { code: attempt.code } : {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
