import { describe, expect, it, vi } from "vitest";
import type { BackendResult } from "./backend";
import {
  ACCESS_COOKIE,
  PENDING_PAYMENT_COOKIE,
  PENDING_TOPUP_COOKIE,
  REFRESH_COOKIE
} from "./session";
import { callWithSession, type SessionPairResult } from "./with-session";

const freshPair = {
  token: "new-access",
  refreshToken: "new-refresh",
  expiresInSeconds: 604800,
  refreshExpiresInSeconds: 2592000
};

function unauthorized(): BackendResult<never> {
  return { ok: false, status: 401, message: "Unauthorized" };
}

async function refreshSucceeds(): Promise<SessionPairResult> {
  return { ok: true, data: freshPair };
}

async function refreshFails(): Promise<SessionPairResult> {
  return { ok: false, status: 401, message: "Invalid refresh token" };
}

function cookieNames(cookies: { name: string }[]) {
  return cookies.map((cookie) => cookie.name);
}

describe("callWithSession", () => {
  it("calls the backend with the access token and sets no cookies when it succeeds", async () => {
    const call = vi.fn(async () => ({ ok: true, data: { id: 7 } }) as BackendResult<{ id: number }>);

    const result = await callWithSession(
      { accessToken: "good-access", refreshToken: "refresh" },
      call,
      { refresh: vi.fn(refreshSucceeds) }
    );

    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith("good-access");
    expect(result).toEqual({ ok: true, data: { id: 7 }, cookies: [] });
  });

  it("refreshes and retries once when the access token is rejected", async () => {
    const call = vi
      .fn<(token: string) => Promise<BackendResult<{ id: number }>>>()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce({ ok: true, data: { id: 7 } });
    const refresh = vi.fn(refreshSucceeds);

    const result = await callWithSession(
      { accessToken: "stale-access", refreshToken: "refresh" },
      call,
      { refresh }
    );

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith("refresh");
    expect(call.mock.calls.map(([token]) => token)).toEqual(["stale-access", "new-access"]);
    expect(result.ok).toBe(true);
    expect(cookieNames(result.cookies)).toEqual([ACCESS_COOKIE, REFRESH_COOKIE]);
    expect(result.cookies[0]?.value).toBe("new-access");
  });

  it("refreshes first when the access cookie has already expired away", async () => {
    const call = vi.fn(async () => ({ ok: true, data: { id: 7 } }) as BackendResult<{ id: number }>);
    const refresh = vi.fn(refreshSucceeds);

    const result = await callWithSession({ refreshToken: "refresh" }, call, { refresh });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith("refresh");
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith("new-access");
    expect(result.ok).toBe(true);
  });

  it("clears the session when the refresh token is also rejected", async () => {
    const call = vi.fn(async () => unauthorized() as BackendResult<never>);

    const result = await callWithSession(
      { accessToken: "stale-access", refreshToken: "dead-refresh" },
      call,
      { refresh: vi.fn(refreshFails) }
    );

    expect(result).toMatchObject({ ok: false, status: 401 });
    expect(cookieNames(result.cookies)).toEqual([
      ACCESS_COOKIE,
      REFRESH_COOKIE,
      PENDING_PAYMENT_COOKIE,
      PENDING_TOPUP_COOKIE
    ]);
  });

  it("does not retry a second time when the refreshed token is still rejected", async () => {
    const call = vi.fn(async () => unauthorized() as BackendResult<never>);
    const refresh = vi.fn(refreshSucceeds);

    const result = await callWithSession(
      { accessToken: "stale-access", refreshToken: "refresh" },
      call,
      { refresh }
    );

    expect(call).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: false, status: 401 });
    expect(cookieNames(result.cookies)).toEqual([
      ACCESS_COOKIE,
      REFRESH_COOKIE,
      PENDING_PAYMENT_COOKIE,
      PENDING_TOPUP_COOKIE
    ]);
  });

  it("rejects without calling the backend when there is no session at all", async () => {
    const call = vi.fn(async () => ({ ok: true, data: {} }) as BackendResult<object>);
    const refresh = vi.fn(refreshSucceeds);

    const result = await callWithSession({}, call, { refresh });

    expect(call).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("passes non-auth failures straight through without refreshing", async () => {
    const call = vi.fn(
      async () => ({ ok: false, status: 502, message: "Upstream down" }) as BackendResult<never>
    );
    const refresh = vi.fn(refreshSucceeds);

    const result = await callWithSession({ accessToken: "good", refreshToken: "r" }, call, {
      refresh
    });

    expect(refresh).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, status: 502, message: "Upstream down", cookies: [] });
  });
});
