import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => vi.unstubAllGlobals());

function call(body: BodyInit, headers: Record<string, string> = { authorization: "Bearer admin-tok" }) {
  return POST(
    new Request("http://localhost:3000/bff/admin/errors/evt_1/claim", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body
    }),
    { params: Promise.resolve({ id: "evt 1" }) }
  );
}

describe("POST /bff/admin/errors/:id/claim", () => {
  it("proxies the body to the backend claim endpoint with the admin bearer", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: "success", data: { ok: true } })));
    vi.stubGlobal("fetch", fetchMock);
    const response = await call(JSON.stringify({ action: "mark_safe_to_retry", confirm: "checked-airalo" }));
    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/admin\/errors\/evt%201\/claim$/);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer admin-tok");
    expect(JSON.parse(String(init.body))).toEqual({ action: "mark_safe_to_retry", confirm: "checked-airalo" });
  });

  it("returns the backend refusal message and status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: "error", error: "Updated too recently" }), { status: 409 })));
    const response = await call(JSON.stringify({ action: "mark_safe_to_retry", confirm: "checked-airalo" }));
    expect(response.status).toBe(409);
    expect((await response.json()).message).toBe("Updated too recently");
  });

  it("rejects a non-object body without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await call("[1]")).status).toBe(400);
    expect((await call("{nope")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
