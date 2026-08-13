import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { buildClearedSessionCookies } from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

/**
 * Deletes the account, then signs the browser out.
 *
 * The sign-out only happens on success: clearing cookies after a failed
 * deletion would strand the visitor outside an account that still exists.
 */
export async function DELETE(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ deleted: true }>("/user/account", { method: "DELETE", token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, buildClearedSessionCookies());
}
