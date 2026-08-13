import { backendFetch, type BackendResult } from "./backend";
import {
  buildClearedSessionCookies,
  buildSessionCookies,
  type CookieSpec,
  type SessionPair
} from "./session";

export type SessionPairResult = BackendResult<SessionPair>;

export type SessionTokens = {
  accessToken?: string;
  refreshToken?: string;
};

export type SessionAttempt<T> =
  | { ok: true; data: T; cookies: CookieSpec[] }
  | { ok: false; status: number; message: string; cookies: CookieSpec[] };

export type SessionDeps = {
  refresh: (refreshToken: string) => Promise<SessionPairResult>;
};

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";

function refreshSession(refreshToken: string): Promise<SessionPairResult> {
  return backendFetch<SessionPair>("/auth/refresh", {
    method: "POST",
    body: { refreshToken }
  });
}

/**
 * Runs a backend call with the browser's session, transparently refreshing the
 * token at most once. Cookie mutations are returned rather than applied so this
 * stays usable from any route handler and stays testable without Next runtime.
 */
export async function callWithSession<T>(
  tokens: SessionTokens,
  call: (token: string) => Promise<BackendResult<T>>,
  deps: SessionDeps = { refresh: refreshSession }
): Promise<SessionAttempt<T>> {
  const expired = (): SessionAttempt<T> => ({
    ok: false,
    status: 401,
    message: SESSION_EXPIRED_MESSAGE,
    cookies: buildClearedSessionCookies()
  });

  if (!tokens.accessToken && !tokens.refreshToken) {
    return expired();
  }

  if (tokens.accessToken) {
    const first = await call(tokens.accessToken);

    if (first.ok) {
      return { ok: true, data: first.data, cookies: [] };
    }

    if (first.status !== 401) {
      return { ok: false, status: first.status, message: first.message, cookies: [] };
    }
  }

  if (!tokens.refreshToken) {
    return expired();
  }

  const refreshed = await deps.refresh(tokens.refreshToken);
  if (!refreshed.ok) {
    return expired();
  }

  const retried = await call(refreshed.data.token);
  const cookies = buildSessionCookies(refreshed.data);

  if (retried.ok) {
    return { ok: true, data: retried.data, cookies };
  }

  // A rejection with a freshly minted token means the session is genuinely gone.
  if (retried.status === 401) {
    return expired();
  }

  return { ok: false, status: retried.status, message: retried.message, cookies };
}
