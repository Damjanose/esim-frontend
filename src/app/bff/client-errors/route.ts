import { backendFetch, getClientIp, getClientUserAgent } from "@/lib/backend";
import { isAllowedClientErrorOrigin } from "@/lib/client-error-origin";
import { buildClientErrorPayload, type ClientErrorInput } from "@/lib/report-client-error";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { readEmailHintFromToken } from "@/lib/session-identity";

/** The backend caps this ingest at 64 KB; stay under it. */
const MAX_BODY_BYTES = 60 * 1024;

/** Reads at most `max` BYTES (not UTF-16 units) and stops pulling the stream once exceeded; null = too large. */
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

/**
 * Public browser error ingest (no admin auth). Rebuilds the payload through
 * buildClientErrorPayload so source/platform are forced and card-like keys are
 * dropped even if a caller sends them. Anonymous unless a session cookie exists,
 * in which case the access token rides along; if the backend rejects that token
 * the report is retried anonymously so an expired session never loses an error.
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

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return errorJson("Invalid request body", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorJson("Invalid request body", 400);
  }
  const input = body as ClientErrorInput;
  if (typeof input.message !== "string" || !input.message.trim()) {
    return errorJson("message is required", 400);
  }

  const { accessToken } = readSessionTokens(request);
  const payload = buildClientErrorPayload({
    ...input,
    userEmail: readEmailHintFromToken(accessToken) ?? undefined
  });

  const send = (token?: string) =>
    backendFetch<{ referenceId?: string }>("/client-errors", {
      method: "POST",
      body: payload,
      token,
      clientIp: getClientIp(request),
      clientUserAgent: getClientUserAgent(request)
    });

  let result = await send(accessToken);
  if (!result.ok && result.status === 401 && accessToken) {
    result = await send(undefined);
  }

  if (!result.ok) {
    return errorJson("Could not record the error report.", result.status >= 400 && result.status < 600 ? result.status : 502);
  }
  return successJson({ referenceId: result.data.referenceId ?? payload.referenceId });
}
