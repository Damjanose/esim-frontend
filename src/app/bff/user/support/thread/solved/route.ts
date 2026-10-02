import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** The traveler closes their conversation; the next message opens a fresh one. */
export async function POST(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/support/thread/solved", { method: "POST", token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
