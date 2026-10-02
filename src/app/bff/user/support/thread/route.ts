import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";
import type { SupportMessage, SupportThread } from "@/app/xsupport/support-types";

export type UserSupportThreadPayload = {
  thread: SupportThread | null;
  messages: SupportMessage[];
};

/** The traveler's open support conversation (null thread when there is none yet). */
export async function GET(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<UserSupportThreadPayload>("/support/thread", { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
