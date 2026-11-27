import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marketingRequest } from "./marketingApi";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

describe("marketingRequest", () => {
  it("sends the bearer token and the method, and returns the data on success", async () => {
    respond(200, { status: "success", data: { entries: [] } });
    const result = await marketingRequest<{ entries: unknown[] }>("admin-token", "GET", "/bff/admin/insights/ad-spend?from=2026-11-01&to=2026-11-30");
    expect(result).toEqual({ ok: true, data: { entries: [] } });
    const [path, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe("/bff/admin/insights/ad-spend?from=2026-11-01&to=2026-11-30");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer admin-token");
    expect(init.body).toBeUndefined();
  });

  it("sends a JSON body with POST and PUT", async () => {
    respond(201, { status: "success", data: { entry: { id: "1" } } });
    await marketingRequest("admin-token", "POST", "/bff/admin/insights/chart-notes", { date: "2026-11-27", kind: "ad", title: "Sale" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ date: "2026-11-27", kind: "ad", title: "Sale" });
  });

  it("returns the backend error code, such as invalid_source", async () => {
    respond(400, { status: "error", message: "invalid_source" });
    const result = await marketingRequest("admin-token", "POST", "/bff/admin/insights/ad-spend", {});
    expect(result).toEqual({ ok: false, code: "invalid_source", unauthorized: false });
  });

  it("flags a 401 so the page can sign the admin out", async () => {
    respond(401, { status: "error", message: "unauthorized" });
    const result = await marketingRequest("admin-token", "GET", "/bff/admin/insights/chart-notes");
    expect(result).toEqual({ ok: false, code: "unauthorized", unauthorized: true });
  });

  it("reports a network failure without throwing", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await marketingRequest("admin-token", "DELETE", "/bff/admin/insights/ad-spend/1");
    expect(result).toEqual({ ok: false, code: "network", unauthorized: false });
  });
});
