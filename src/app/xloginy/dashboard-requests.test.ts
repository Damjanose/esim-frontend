import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProviderChecks, requestAdminData, startProviderQueue } from "./dashboard-requests";
import type { ProviderDetails, ProviderState } from "./dashboard-model";

const epoch = Date.parse("2026-10-30T12:00:00Z");
const sim = { iccid: "test-sim", status: null, activatedAt: null, expiresAt: null,
  remainingMb: null, totalMb: null, isUnlimited: null, remainingVoice: null,
  totalVoice: null, remainingText: null, totalText: null, error: "Provider unavailable" };
const response = (sims: ProviderDetails["sims"] = []) => new Response(JSON.stringify({
  status: "success", data: { checkedAt: new Date().toISOString(), sims },
}));
const deferred = () => {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve };
};
const setup = () => {
  const states: Record<string, ProviderState> = {};
  const unauthorized = vi.fn();
  let current = true;
  const checks = createProviderChecks({ token: "admin-session", isCurrent: () => current,
    onUnauthorized: unauthorized, onState: (id, state) => { states[id] = state; } });
  return { checks, states, unauthorized, supersede: () => { current = false; } };
};

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(epoch); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("provider requests", () => {
  it("rechecks partial provider errors after 30 seconds instead of retaining them for 20 minutes", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", async () => { calls++; return response([sim]); });
    const { checks } = setup();
    await checks.check("order");
    vi.setSystemTime(epoch + 29_000);
    await checks.check("order");
    expect(calls).toBe(1);
    vi.setSystemTime(epoch + 31_000);
    await checks.check("order");
    expect(calls).toBe(2);
  });
  it("keeps successful provider data cached for 20 minutes and coalesces concurrent checks", async () => {
    const pending = deferred();
    let calls = 0;
    vi.stubGlobal("fetch", () => { calls++; return pending.promise; });
    const { checks, states } = setup();
    const first = checks.check("order");
    const second = checks.check("order");
    pending.resolve(response([{ ...sim, error: null, status: "ACTIVE" }]));
    await Promise.all([first, second]);
    vi.setSystemTime(epoch + 19 * 60_000);
    await checks.check("order");
    expect(calls).toBe(1);
    expect(states.order.data?.sims[0].status).toBe("ACTIVE");
  });
  it("aborts the obsolete page's in-flight request and never schedules its remaining rows", async () => {
    const pending = deferred();
    const calls: { path: string; signal: AbortSignal }[] = [];
    vi.stubGlobal("fetch", (path: string, init: RequestInit) => {
      calls.push({ path, signal: init.signal! });
      return pending.promise;
    });
    const { checks, states } = setup();
    const stop = startProviderQueue(["old-first", "old-second"], checks);
    expect(calls.length).toBe(1);
    stop();
    expect(calls[0].signal.aborted).toBe(true);
    pending.resolve(response());
    await vi.runAllTimersAsync();
    expect(calls.length).toBe(1);
    expect(states["old-first"].data).toBeUndefined();
  });
  it("does not sign out the new session when an older provider request returns 401", async () => {
    const pending = deferred();
    vi.stubGlobal("fetch", () => pending.promise);
    const { checks, unauthorized, supersede, states } = setup();
    const request = checks.check("old-order");
    supersede();
    pending.resolve(new Response("", { status: 401 }));
    await request;
    expect(unauthorized).not.toHaveBeenCalled();
    expect(states["old-order"].error).toBeUndefined();
  });
});

it("ignores an aborted dashboard response before handling a late 401", async () => {
  const pending = deferred();
  vi.stubGlobal("fetch", () => pending.promise);
  const controller = new AbortController();
  const unauthorized = vi.fn();
  const request = requestAdminData("/bff/admin/dashboard", { token: "old-session",
    signal: controller.signal, isCurrent: () => true, onUnauthorized: unauthorized });
  controller.abort();
  pending.resolve(new Response("", { status: 401 }));
  await expect(request).rejects.toThrow();
  expect(unauthorized).not.toHaveBeenCalled();
});

it("keeps a replacement request coalesced when its aborted predecessor finishes late", async () => {
  const oldResponse = deferred();
  const newResponse = deferred();
  let calls = 0;
  vi.stubGlobal("fetch", () => ++calls === 1 ? oldResponse.promise : newResponse.promise);
  const { checks, states } = setup();
  const old = checks.check("order");
  checks.cancelPending();
  const replacement = checks.check("order");
  oldResponse.resolve(response([{ ...sim, error: null, status: "EXPIRED" }]));
  await old;
  const duplicate = checks.check("order");
  expect(calls).toBe(2);
  newResponse.resolve(response([{ ...sim, error: null, status: "ACTIVE" }]));
  await Promise.all([replacement, duplicate]);
  expect(states.order.data?.sims[0].status).toBe("ACTIVE");
});

it("checks visible purchases serially with a delay between completed checks", async () => {
  const calls: string[] = [];
  vi.stubGlobal("fetch", async (path: string) => { calls.push(path); return response(); });
  const { checks } = setup();
  const stop = startProviderQueue(["first", "second"], checks);
  await vi.advanceTimersByTimeAsync(0);
  expect(calls).toEqual(["/bff/admin/dashboard/purchases/first/provider"]);
  await vi.advanceTimersByTimeAsync(649);
  expect(calls.length).toBe(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(calls).toEqual(["/bff/admin/dashboard/purchases/first/provider", "/bff/admin/dashboard/purchases/second/provider"]);
  stop();
});

it("still signs out an active session when its current request returns 401", async () => {
  vi.stubGlobal("fetch", async () => new Response("", { status: 401 }));
  const unauthorized = vi.fn();
  await expect(requestAdminData("/bff/admin/dashboard", { token: "expired-session",
    signal: new AbortController().signal, isCurrent: () => true, onUnauthorized: unauthorized,
  })).rejects.toThrow("Session expired");
  expect(unauthorized).toHaveBeenCalledOnce();
});
