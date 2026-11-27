import { beforeEach, describe, expect, it, vi } from "vitest";

const backendFetch = vi.fn(async (_path: string, _options?: unknown) => ({ ok: true as const, data: {} }));
vi.mock("@/lib/backend", () => ({
  backendFetch: (...args: unknown[]) => backendFetch(...(args as [string, unknown])),
  getClientUserAgent: () => undefined
}));

import { GET as reportGet } from "./[report]/route";
import { GET as adSpendGet, POST as adSpendPost } from "./ad-spend/route";
import { PUT as adSpendPut, DELETE as adSpendDelete } from "./ad-spend/[id]/route";
import { GET as notesGet, POST as notesPost } from "./chart-notes/route";
import { DELETE as notesDelete } from "./chart-notes/[id]/route";

const token = "Bearer admin-token";

function req(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost:3000/bff/admin/insights${path}`, {
    ...init,
    headers: { Authorization: token, "Content-Type": "application/json", ...(init.headers ?? {}) }
  });
}

function lastCall() {
  const [path, options] = backendFetch.mock.calls[0] as unknown as [string, { method?: string; body?: unknown; token?: string }];
  return { path, options };
}

beforeEach(() => {
  backendFetch.mockClear();
});

describe("ad-spend BFF routes", () => {
  it("GET forwards only from and to", async () => {
    await adSpendGet(req("/ad-spend?from=2026-11-01&to=2026-11-30&evil=1"));
    expect(lastCall().path).toBe("/admin/analytics/ad-spend?from=2026-11-01&to=2026-11-30");
    expect(lastCall().options.method).toBeUndefined();
  });

  it("POST sends the JSON body with the POST method", async () => {
    const body = { source: "google", medium: "cpc", campaign: "fall", from: "2026-11-01", to: "2026-11-10", amountCents: 1250, currency: "usd", note: null };
    await adSpendPost(req("/ad-spend", { method: "POST", body: JSON.stringify(body) }));
    const { path, options } = lastCall();
    expect(path).toBe("/admin/analytics/ad-spend");
    expect(options.method).toBe("POST");
    expect(options.body).toEqual(body);
    expect(options.token).toBe("admin-token");
  });

  it("PUT and DELETE use the id in the path", async () => {
    await adSpendPut(req("/ad-spend/abc", { method: "PUT", body: "{}" }), { params: Promise.resolve({ id: "abc" }) });
    expect(lastCall().path).toBe("/admin/analytics/ad-spend/abc");
    expect(lastCall().options.method).toBe("PUT");
    backendFetch.mockClear();
    await adSpendDelete(req("/ad-spend/abc", { method: "DELETE" }), { params: Promise.resolve({ id: "abc" }) });
    expect(lastCall().path).toBe("/admin/analytics/ad-spend/abc");
    expect(lastCall().options.method).toBe("DELETE");
  });
});

describe("chart-notes BFF routes", () => {
  it("GET forwards from and to only", async () => {
    await notesGet(req("/chart-notes?from=2026-11-01&to=2026-11-30&x=1"));
    expect(lastCall().path).toBe("/admin/analytics/chart-notes?from=2026-11-01&to=2026-11-30");
  });

  it("POST forwards the body", async () => {
    const body = { date: "2026-11-27", kind: "release", title: "New app build" };
    await notesPost(req("/chart-notes", { method: "POST", body: JSON.stringify(body) }));
    expect(lastCall().path).toBe("/admin/analytics/chart-notes");
    expect(lastCall().options.method).toBe("POST");
    expect(lastCall().options.body).toEqual(body);
  });

  it("DELETE uses the id in the path", async () => {
    await notesDelete(req("/chart-notes/n1", { method: "DELETE" }), { params: Promise.resolve({ id: "n1" }) });
    expect(lastCall().path).toBe("/admin/analytics/chart-notes/n1");
    expect(lastCall().options.method).toBe("DELETE");
  });
});

describe("report allowlist (Wave 2 and 3)", () => {
  it.each(["daily", "campaign-return", "promotions", "customers", "seasons", "acquisition", "opportunities"])(
    "accepts %s",
    async (report) => {
      const response = await reportGet(req(`/${report}`), { params: Promise.resolve({ report }) });
      expect(response.status).toBe(200);
      expect(lastCall().path).toBe(`/admin/analytics/${report}`);
    }
  );
});

describe("malformed JSON bodies are rejected before reaching the backend", () => {
  it("ad-spend POST returns 400 invalid_body", async () => {
    const response = await adSpendPost(req("/ad-spend", { method: "POST", body: "not json" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", message: "invalid_body" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("ad-spend PUT returns 400 invalid_body", async () => {
    const response = await adSpendPut(req("/ad-spend/abc", { method: "PUT", body: "{" }), { params: Promise.resolve({ id: "abc" }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", message: "invalid_body" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("chart-notes POST returns 400 invalid_body", async () => {
    const response = await notesPost(req("/chart-notes", { method: "POST", body: "" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", message: "invalid_body" });
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
