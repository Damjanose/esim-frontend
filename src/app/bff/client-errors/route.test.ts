import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const originalEnv = { ...process.env };

function post(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/bff/client-errors", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });
}

function okBackend() {
  return vi.fn(async () => new Response(JSON.stringify({ status: "success", data: { referenceId: "srv-ref-123" } }), { status: 201 }));
}

beforeEach(() => {
  process.env = { ...originalEnv, BACKEND_API_URL: "https://backend.test/api", BFF_SHARED_SECRET: "bff-secret" };
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

describe("POST /bff/client-errors", () => {
  it("rejects a foreign Origin without calling the backend", async () => {
    const fetchMock = okBackend();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(post(JSON.stringify({ message: "x" }), { origin: "https://evil.example" }));
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 413 for a body over the byte cap, even without Content-Length", async () => {
    const fetchMock = okBackend();
    vi.stubGlobal("fetch", fetchMock);
    // 25k astral chars = 100 KB in UTF-8 but only 50k UTF-16 units: a length check alone would miss it.
    const body = JSON.stringify({ message: "😀".repeat(25_000) });
    const response = await POST(post(body));
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400, not 500, for invalid JSON and missing message", async () => {
    vi.stubGlobal("fetch", okBackend());
    expect((await POST(post("{nope"))).status).toBe(400);
    expect((await POST(post(JSON.stringify({ stack: "s" })))).status).toBe(400);
    expect((await POST(post(JSON.stringify([1, 2])))).status).toBe(400);
  });

  it("does not 500 on malformed field types", async () => {
    const fetchMock = okBackend();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      post(JSON.stringify({ message: "boom", stack: { length: 99999 }, scenario: 5, stage: ["a"], screen: {}, errorName: 1 }))
    );
    expect(response.status).toBe(200);
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(sent.stack).toBeUndefined();
    expect(sent.scenario).toBeUndefined();
    expect(sent.message).toBe("boom");
    expect(sent.source).toBe("client-web");
  });

  it("does not forward the caller's Authorization, X-BFF-Key or X-Client-IP", async () => {
    const fetchMock = okBackend();
    vi.stubGlobal("fetch", fetchMock);
    await POST(
      post(JSON.stringify({ message: "boom" }), {
        authorization: "Bearer attacker",
        "x-bff-key": "guess",
        "x-client-ip": "6.6.6.6",
        "cf-connecting-ip": "9.9.9.9"
      })
    );
    const headers = new Headers((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers);
    expect(headers.has("authorization")).toBe(false);
    expect(headers.get("x-bff-key")).toBe("bff-secret");
    expect(headers.get("x-client-ip")).toBe("9.9.9.9");
  });
});
