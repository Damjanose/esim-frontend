import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE, PENDING_TOPUP_COOKIE } from "@/lib/session";
import { POST as createTopupIntent } from "../bff/payments/topups/intent/route";
import { GET as topupReturn } from "./topup/return/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const paymentSession = {
  paymentId: "sdk_order_topup_1",
  checkoutUrl: "https://isdk-web-staging.pokpay.io/sdk-orders/sdk_order_topup_1",
  amount: 6.5,
  currency: "EUR",
  environment: "staging"
};

function intentRequest(body: unknown, cookie = `${ACCESS_COOKIE}=good-token`) {
  return new Request("http://localhost:3000/bff/payments/topups/intent", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
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

describe("POST /bff/payments/topups/intent", () => {
  it("asks the backend for a checkout url and remembers which eSIM is topping up", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: paymentSession }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await createTopupIntent(
      intentRequest({ order_id: 42, package_id: "hej-topup-1gb-7days" })
    );
    const payload = (await response.json()) as { data: { checkoutUrl: string } };

    expect(response.status).toBe(200);
    expect(payload.data.checkoutUrl).toBe(paymentSession.checkoutUrl);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sentBody = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(sentBody.order_id).toBe(42);
    expect(sentBody.package_id).toBe("hej-topup-1gb-7days");
    // The backend validates this against its allowed web return origins.
    expect(sentBody.return_url).toBe("http://localhost:3000/account/topup/return");

    // The provisioning response carries no order id, so the return handler can
    // only get the visitor back to their eSIM via this cookie.
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${PENDING_TOPUP_COOKIE}=42`);
  });

  it("rejects a request with no plan chosen", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createTopupIntent(intentRequest({ order_id: 42 }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request with no eSIM to top up", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createTopupIntent(intentRequest({ package_id: "hej-topup-1gb" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a backend refusal straight through to the buyer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "Top-up package price is invalid" }, 422)
      )
    );

    const response = await createTopupIntent(
      intentRequest({ order_id: 42, package_id: "hej-topup-1gb" })
    );
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(422);
    expect(payload.error).toBe("Top-up package price is invalid");
  });
});

describe("GET /account/topup/return", () => {
  function returnRequest(query: string, cookies: string) {
    return new Request(`http://localhost:3000/account/topup/return${query}`, {
      headers: { cookie: cookies }
    });
  }

  it("provisions the paid top-up and returns the buyer to their eSIM", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { topup: { id: 9 }, alreadyProvisioned: false } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await topupReturn(
      returnRequest(
        "?payment_id=sdk_order_topup_1",
        `${ACCESS_COOKIE}=good-token; ${PENDING_TOPUP_COOKIE}=42`
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/account/42?topup=1"
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ payment_id: "sdk_order_topup_1" });

    // The reference is single-use; leaving it set would re-provision on reload.
    expect(response.headers.get("set-cookie")).toContain(`${PENDING_TOPUP_COOKIE}=;`);
  });

  it("falls back to the payment cookie when Pokpay returns without the id", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { topup: { id: 9 } } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await topupReturn(
      returnRequest("", `${ACCESS_COOKIE}=good-token; ${PENDING_TOPUP_COOKIE}=42:sdk_order_x`)
    );

    expect(response.status).toBe(303);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ payment_id: "sdk_order_x" });
  });

  it("sends the buyer to the failure page when the payment did not complete", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Payment has not succeeded" }, 402))
    );

    const response = await topupReturn(
      returnRequest(
        "?payment_id=sdk_order_topup_1",
        `${ACCESS_COOKIE}=good-token; ${PENDING_TOPUP_COOKIE}=42`
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/checkout/failed");
    expect(response.headers.get("location")).toContain("reason=unpaid");
  });

  it("never claims the card was untouched when provisioning fails for another reason", async () => {
    // Anything other than 402 may have taken the money.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Provider unavailable" }, 502))
    );

    const response = await topupReturn(
      returnRequest(
        "?payment_id=sdk_order_topup_1",
        `${ACCESS_COOKIE}=good-token; ${PENDING_TOPUP_COOKIE}=42`
      )
    );

    expect(response.headers.get("location")).toContain("reason=provisioning");
    expect(response.headers.get("location")).not.toContain("reason=unpaid");
  });

  it("sends the buyer somewhere sensible when there is no payment reference at all", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await topupReturn(returnRequest("", `${ACCESS_COOKIE}=good-token`));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("reason=missing_payment");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
