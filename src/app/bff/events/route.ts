import { NextResponse } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/adminTokenCookie";
import { backendFetch, getClientGeo, getClientIp, getClientUserAgent } from "@/lib/backend";
import { isAllowedClientErrorOrigin } from "@/lib/client-error-origin";
import { CONSENT_COOKIE_NAME, parseConsentCookie } from "@/lib/consent";
import { errorJson, readCookie, readSessionTokens, successJson } from "@/lib/route-response";
import { isBotUserAgent } from "./bot";

/** The backend accepts up to 32 KB; a batch of 20 small events is far below this cap. */
const MAX_BODY_BYTES = 16 * 1024;

/** Reads at most `max` BYTES and stops pulling the stream once exceeded; null = too large. */
async function readBodyCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

const noContent = () => new NextResponse(null, { status: 204 });

/**
 * Public web analytics ingest. Does nothing (204, no backend call) unless the visitor
 * has given analytics consent, is not signed in to the admin, and is not a bot.
 * Otherwise forwards the batch with the visitor's IP and location, plus the session
 * token when there is one (a stale token is retried once without it).
 */
export async function POST(request: Request) {
  if (!isAllowedClientErrorOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return errorJson("Forbidden", 403);
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return errorJson("Payload too large", 413);
  }

  let raw: string | null;
  try {
    raw = await readBodyCapped(request, MAX_BODY_BYTES);
  } catch {
    return errorJson("Invalid request body", 400);
  }
  if (raw === null) {
    return errorJson("Payload too large", 413);
  }

  const consent = parseConsentCookie(readCookie(request, CONSENT_COOKIE_NAME));
  if (!consent?.analytics) return noContent();
  if (readCookie(request, ADMIN_TOKEN_COOKIE)) return noContent();
  if (isBotUserAgent(request.headers.get("user-agent"))) return noContent();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return errorJson("Invalid request body", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorJson("Invalid request body", 400);
  }

  const { accessToken } = readSessionTokens(request);
  const send = (token?: string) =>
    backendFetch<unknown>("/analytics/events", {
      method: "POST",
      body,
      token,
      clientIp: getClientIp(request),
      clientGeo: getClientGeo(request),
      clientUserAgent: getClientUserAgent(request)
    });

  let result = await send(accessToken);
  if (!result.ok && result.status === 401 && accessToken) {
    result = await send(undefined);
  }

  if (!result.ok) {
    return errorJson(result.message, result.status >= 400 && result.status < 600 ? result.status : 502);
  }
  return successJson(result.data);
}
