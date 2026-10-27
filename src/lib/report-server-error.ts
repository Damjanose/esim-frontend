import { backendFetch, getClientIp, getClientUserAgent } from "./backend";
import { buildClientErrorPayload, type ClientErrorInput } from "./report-client-error";
import { readEmailHintFromToken } from "./session-identity";

const SEND_TIMEOUT_MS = 1200;

/**
 * Server-side (route handler) report into the backend /client-errors ingest.
 * Resolves with the reference id even when the send fails or is slow: callers
 * put it in a redirect URL, so this must be quick and must never throw.
 */
export async function reportServerError(
  request: Request,
  input: ClientErrorInput,
  accessToken?: string
): Promise<{ referenceId: string }> {
  const payload = buildClientErrorPayload({
    ...input,
    userEmail: input.userEmail ?? readEmailHintFromToken(accessToken) ?? undefined
  });
  try {
    await Promise.race([
      backendFetch("/client-errors", {
        method: "POST",
        body: payload,
        token: accessToken,
        clientIp: getClientIp(request),
        clientUserAgent: getClientUserAgent(request)
      }),
      new Promise((resolve) => setTimeout(resolve, SEND_TIMEOUT_MS))
    ]);
  } catch {
    // reporting is best effort
  }
  return { referenceId: payload.referenceId };
}
