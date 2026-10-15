import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** The traveler has their chat open: a read receipt that only the admin inbox shows. */
export async function POST(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/support/thread/read", { method: "POST", token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
