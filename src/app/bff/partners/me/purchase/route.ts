import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export async function POST(request: Request) {
  let body: { packageId?: unknown; sendAsGift?: unknown };
  try {
    body = (await request.json()) as { packageId?: unknown; sendAsGift?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  // Shape/state validation stays on the backend, which owns the rules and
  // the messages; this only forwards whatever value was sent.
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/partners/me/purchase", {
      method: "POST",
      body: { packageId: body.packageId, sendAsGift: body.sendAsGift },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
