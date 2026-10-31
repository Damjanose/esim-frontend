import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const context = { params: Promise.resolve({ id: "t1" }) };
const request = () =>
  new Request("http://localhost:3000/bff/admin/support/threads/t1/reopen", {
    method: "POST",
    headers: { Authorization: "Bearer admin-token" }
  });

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /bff/admin/support/threads/:id/reopen", () => {
  it("proxies a successful reopen with the admin bearer", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: { thread: { id: "t1", status: "read" } } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request(), context);

    expect(response.status).toBe(200);
    expect((await response.json()).data.thread.id).toBe("t1");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/admin\/support\/threads\/t1\/reopen$/);
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer admin-token");
  });

  it("keeps the 409 code and open thread id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", code: "USER_HAS_OPEN_THREAD", message: "Open thread exists", openThreadId: "t9" }, 409)
      )
    );

    const response = await POST(request(), context);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "USER_HAS_OPEN_THREAD", openThreadId: "t9" });
  });

  it("passes a 404 through", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error", message: "Not found" }, 404)));
    expect((await POST(request(), context)).status).toBe(404);
  });
});
