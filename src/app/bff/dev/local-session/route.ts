import { getBackendApiUrl } from "@/lib/backend";
import { errorJson, successJson } from "@/lib/route-response";
import { buildSessionCookies } from "@/lib/session";

/**
 * Local-only helper for browser smoke tests. Sets httpOnly session cookies from
 * a pre-minted local backend token pair.
 *
 * This route mints a session for whatever token pair the caller supplies, so it
 * must never be reachable in production. The loopback-backend check below is
 * not sufficient on its own: it reads the server's own BACKEND_API_URL, so a
 * production deploy misconfigured (or deliberately proxied) to a loopback
 * address would satisfy it and hand any caller a valid session. The NODE_ENV
 * check is the real gate; the loopback check stays as a second condition.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return errorJson("Forbidden", 403);
  }

  const backend = getBackendApiUrl();
  if (!backend.includes("127.0.0.1") && !backend.includes("localhost")) {
    return errorJson("Forbidden", 403);
  }

  let body: { token?: unknown; refreshToken?: unknown; expiresInSeconds?: unknown; refreshExpiresInSeconds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken.trim() : "";
  if (!token || !refreshToken) {
    return errorJson("token and refreshToken are required", 400);
  }

  return successJson(
    { ok: true },
    buildSessionCookies({
      token,
      refreshToken,
      expiresInSeconds: typeof body.expiresInSeconds === "number" ? body.expiresInSeconds : 7 * 24 * 60 * 60,
      refreshExpiresInSeconds:
        typeof body.refreshExpiresInSeconds === "number" ? body.refreshExpiresInSeconds : 30 * 24 * 60 * 60
    })
  );
}
