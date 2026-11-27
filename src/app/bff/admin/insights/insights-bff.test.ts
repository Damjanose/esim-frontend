import { beforeEach, describe, expect, it, vi } from "vitest";

const backendFetch = vi.fn(async () => ({ ok: true as const, data: { report: "overview" } }));
vi.mock("@/lib/backend", () => ({
  backendFetch: (...args: unknown[]) => backendFetch(...(args as [])),
  getClientUserAgent: () => undefined
}));

import { GET } from "./[report]/route";

function call(report: string, search = "") {
  const request = new Request(`http://localhost:3000/bff/admin/insights/${report}${search}`, {
    headers: { Authorization: "Bearer admin-token" }
  });
  return GET(request, { params: Promise.resolve({ report }) });
}

beforeEach(() => {
  backendFetch.mockClear();
});

describe("GET /bff/admin/insights/[report]", () => {
  it("returns 404 for an unknown report without calling the backend", async () => {
    const response = await call("secret-thing");
    expect(response.status).toBe(404);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards only the allowlisted query parameters to the admin analytics path", async () => {
    const response = await call("locations", "?from=2026-11-01&to=2026-11-07&platform=ios&level=city&evil=1&country=US");
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledTimes(1);
    const [path, options] = backendFetch.mock.calls[0] as unknown as [string, { token?: string }];
    expect(path).toBe("/admin/analytics/locations?from=2026-11-01&to=2026-11-07&platform=ios&country=US&level=city");
    expect(path).not.toContain("evil");
    expect(options.token).toBe("admin-token");
  });

  it("caps each forwarded value at 40 characters", async () => {
    await call("overview", `?tz=${"a".repeat(80)}`);
    const [path] = backendFetch.mock.calls[0] as unknown as [string];
    expect(path).toBe(`/admin/analytics/overview?tz=${"a".repeat(40)}`);
  });
});

describe("GET /bff/admin/insights/[report] (Wave 2 and 3 names are not blocked as unknown)", () => {
  it("still returns 404 for a made-up Wave 2 name", async () => {
    const response = await call("daily-secret");
    expect(response.status).toBe(404);
  });
});
