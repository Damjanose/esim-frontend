import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE } from "@/lib/session";
import { POST as quote } from "../bff/checkout/quote/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function quoteRequest(body: unknown) {
  return new Request("http://localhost/bff/checkout/quote", {
    method: "POST",
    headers: { cookie: `${ACCESS_COOKIE}=good-token`, "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /bff/checkout/quote", () => {
  it("requires a packageId", async () => {
    const response = await quote(quoteRequest({}));
    expect(response.status).toBe(400);
  });

  it("forwards the package and optional promo code with the session token", async () => {
    const data = {
      baseCents: 1000,
      partnerDiscountPct: 10,
      partnerFinalCents: 900,
      streakDiscountPct: 5,
      finalCustomerPriceCents: 855
    };
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ status: "success", data }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await quote(quoteRequest({ packageId: " pkg-1 ", promoCode: "HOTEL123" }));

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual(data);
    const [url, init = {}] = fetchMock.mock.calls[0];
    expect(url).toContain("/payments/quote");
    expect(JSON.parse(String(init.body))).toEqual({ packageId: "pkg-1", promoCode: "HOTEL123" });
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer good-token");
  });

  it("omits an empty promo code and passes a top-up orderId through", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse({ status: "success", data: { finalCustomerPriceCents: 450 } })
    );
    vi.stubGlobal("fetch", fetchMock);

    await quote(quoteRequest({ packageId: "topup-1gb", promoCode: "", orderId: 42 }));

    const [, init = {}] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init.body))).toEqual({ packageId: "topup-1gb", orderId: 42 });
  });
});
