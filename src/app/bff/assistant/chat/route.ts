import { backendFetch, type BackendResult } from "@/lib/backend";
import type { AssistantReply } from "@/lib/assistant/types";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export const dynamic = "force-dynamic";

/**
 * One AI assistant turn: proxies `POST /assistant/chat` (the app's endpoint).
 * Signed in, it forwards the session so the backend uses the per-user rate
 * limit and allows the esims/profile screens. Guests, and a session that has
 * expired, go through as guests: the backend allows them the marketplace
 * screen only and rate-limits them per IP.
 */
export async function POST(request: Request) {
  let body: { screen?: unknown; messages?: unknown; lang?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid JSON body", 400);
  }

  const payload = { screen: body.screen, messages: body.messages, lang: body.lang };
  const call = (token?: string): Promise<BackendResult<AssistantReply>> =>
    backendFetch<AssistantReply>("/assistant/chat", { method: "POST", token, body: payload });

  /** Keeps the backend's code (e.g. `assistant_timeout`) so the chat can tell a timeout from an outage. */
  const codeOf = (result: { payload?: Record<string, unknown> }) =>
    typeof result.payload?.code === "string" ? { code: result.payload.code } : {};

  const tokens = readSessionTokens(request);
  if (tokens.accessToken || tokens.refreshToken) {
    const attempt = await callWithSession(tokens, call);
    if (attempt.ok) return successJson(attempt.data, attempt.cookies);
    if (attempt.status !== 401 || body.screen !== "marketplace") {
      return errorJson(attempt.message, attempt.status, attempt.code ? { code: attempt.code } : {}, attempt.cookies);
    }
    // Expired session on a guest-allowed screen: answer as a guest, and still clear the dead cookies.
    const guest = await call();
    return guest.ok
      ? successJson(guest.data, attempt.cookies)
      : errorJson(guest.message, guest.status, codeOf(guest), attempt.cookies);
  }

  const result = await call();
  return result.ok ? successJson(result.data) : errorJson(result.message, result.status, codeOf(result));
}
