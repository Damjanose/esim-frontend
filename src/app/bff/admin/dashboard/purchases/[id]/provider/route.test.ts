import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllGlobals());
const call = () =>
  GET(
    new Request(
      "http://localhost/bff/admin/dashboard/purchases/order1/provider",
      { headers: { authorization: "Bearer admin-token" } },
    ),
    { params: Promise.resolve({ id: "order 1" }) },
  );

describe("admin provider detail BFF", () => {
  it("encodes the order identifier, forwards admin auth and returns provider detail", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "success",
            data: { checkedAt: "2026-10-29T12:00:00Z", sims: [] },
          }),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "success",
      data: { checkedAt: "2026-10-29T12:00:00Z", sims: [] },
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(/\/admin\/dashboard\/purchases\/order%201\/provider$/);
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer admin-token",
    );
    expect(init.cache).toBe("no-store");
  });

  it("preserves authorization failures so the dashboard can sign out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ status: "error", message: "Expired" }),
            { status: 401 },
          ),
      ),
    );
    const response = await call();
    expect(response.status).toBe(401);
    expect((await response.json()).status).toBe("error");
  });
});
