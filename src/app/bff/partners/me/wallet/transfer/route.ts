import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export async function POST(request: Request) {
  let body: { amountCents?: unknown };
  try {
    body = (await request.json()) as { amountCents?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  // Amount validation stays on the backend, which owns the rules and the
  // messages; this only forwards whatever value was sent.
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/partners/me/wallet/transfer", {
      method: "POST",
      body: { amountCents: body.amountCents },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
