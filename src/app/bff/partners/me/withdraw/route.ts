import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export async function POST(request: Request) {
  let body: { payoutEmail?: unknown };
  try {
    body = (await request.json()) as { payoutEmail?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  // Email-format validation stays on the backend, which owns the rules and
  // the messages; this only forwards whatever value was sent.
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/partners/me/withdraw", {
      method: "POST",
      body: { payoutEmail: body.payoutEmail },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
