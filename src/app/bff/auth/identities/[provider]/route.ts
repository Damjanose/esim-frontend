import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/**
 * Unlinks a sign-in provider. The backend refuses with 409 when it is the only
 * way into the account, which is surfaced to the visitor as-is.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (provider !== "google" && provider !== "apple") {
    return errorJson("Unknown sign-in provider.", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ identities: unknown }>(`/auth/identities/${provider}`, {
      method: "DELETE",
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
