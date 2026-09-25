import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE, PENDING_PAYMENT_COOKIE } from "@/lib/session";
import { POST as createIntent } from "../bff/payments/intent/route";
import { POST as applyPromo } from "../bff/checkout/apply-promo/route";
import { POST as provisionPayment } from "../bff/payments/provision/route";
import { GET as checkoutReturn } from "./return/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const paymentSession = {
  paymentId: "sdk_order_123",
  checkoutUrl: "https://isdk-web-staging.pokpay.io/sdk-orders/sdk_order_123",
  amount: 4.5,
  currency: "EUR",
  environment: "staging"
};

const provisionedOrder = {
  id: 1001,
  status: "completed",
  package_id: "hej-telecom-in-30days-20gb",
  sims: [{ qrcode: "LPA:1$smdp.io$ABC", iccid: "8910" }]
};

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /bff/payments/intent", () => {
  it("asks the backend for a payment session and remembers the payment id", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: paymentSession }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await createIntent(
      new Request("http://localhost:3000/bff/payments/intent", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ package_id: "hej-telecom-in-30days-20gb" })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.paymentId).toBe(paymentSession.paymentId);
    expect(payload.data.environment).toBe(paymentSession.environment);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(String(init.body));
    expect(sent.package_id).toBe("hej-telecom-in-30days-20gb");
    // In-app CardStep: never send return_url (avoids allowlist failures on local→prod).
    expect(sent).not.toHaveProperty("return_url");

    const pending = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(`${PENDING_PAYMENT_COOKIE}=`));
    expect(pending).toContain("sdk_order_123");
    expect(pending).toContain("HttpOnly");
  });

  it("does not require a public return origin for in-app plan checkout", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: paymentSession }));
    vi.stubGlobal("fetch", fetchMock);

    // Localhost against a production backend used to 400 with
    // "return_url origin is not allowed" when we still posted return_url.
    const response = await createIntent(
      new Request("http://localhost:3000/bff/payments/intent", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${ACCESS_COOKIE}=good-token`,
          host: "localhost:3000"
        },
        body: JSON.stringify({ package_id: "hej-telecom-in-30days-20gb" })
      })
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).not.toHaveProperty("return_url");
  });

  it("refuses to start a payment without a session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createIntent(
      new Request("http://localhost:3000/bff/payments/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ package_id: "hej-telecom-in-30days-20gb" })
      })
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards an applied promo code to the backend as camelCase promoCode", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: paymentSession }));
    vi.stubGlobal("fetch", fetchMock);

    await createIntent(
      new Request("http://localhost:3000/bff/payments/intent", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({
          package_id: "hej-telecom-in-30days-20gb",
          promo_code: "FRIEND10"
        })
      })
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(String(init.body));
    expect(sent.promoCode).toBe("FRIEND10");
  });

  it("omits promoCode from the backend call entirely when no code was given", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: paymentSession }));
    vi.stubGlobal("fetch", fetchMock);

    await createIntent(
      new Request("http://localhost:3000/bff/payments/intent", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ package_id: "hej-telecom-in-30days-20gb" })
      })
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(String(init.body));
    expect(sent).not.toHaveProperty("promoCode");
  });
});

describe("POST /bff/payments/provision", () => {
  it("provisions the order for a completed payment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { order: provisionedOrder } }, 201))
    );

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ payment_id: "sdk_order_123" })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.order.id).toBe(1001);
  });

  it("reports an unpaid payment as a 402, not a generic error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Payment is not completed" }, 402))
    );

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ payment_id: "sdk_order_123" })
      })
    );

    expect(response.status).toBe(402);
  });

  it("refuses to provision without a session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payment_id: "sdk_order_123" })
      })
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request missing payment_id without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({})
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /bff/checkout/apply-promo", () => {
  it("forwards promoCode and packageId to the backend and passes through a successful application", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "success",
        data: { applied: true, discountPct: 10, finalCustomerPriceCents: 405 }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await applyPromo(
      new Request("http://localhost:3000/bff/checkout/apply-promo", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({
          promoCode: "friend10",
          packageId: "hej-telecom-in-30days-20gb"
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toEqual({ applied: true, discountPct: 10, finalCustomerPriceCents: 405 });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/payments/apply-promo");
    const sent = JSON.parse(String(init.body));
    expect(sent).toEqual({ promoCode: "friend10", packageId: "hej-telecom-in-30days-20gb" });
  });

  it("passes through applied: false as a normal 200 rather than an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { applied: false } }))
    );

    const response = await applyPromo(
      new Request("http://localhost:3000/bff/checkout/apply-promo", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ promoCode: "bogus", packageId: "hej-telecom-in-30days-20gb" })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toEqual({ applied: false });
  });

  it("rejects a request missing promoCode or packageId without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await applyPromo(
      new Request("http://localhost:3000/bff/checkout/apply-promo", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ promoCode: "friend10" })
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses to check a code without a session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await applyPromo(
      new Request("http://localhost:3000/bff/checkout/apply-promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ promoCode: "friend10", packageId: "hej-telecom-in-30days-20gb" })
      })
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /checkout/return", () => {
  function returnRequest(query: string, cookies: string) {
    return new Request(`http://localhost:3000/checkout/return${query}`, {
      headers: { cookie: cookies }
    });
  }

  it("provisions the paid order and sends the buyer to their new eSIM", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { order: provisionedOrder } }, 201)
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await checkoutReturn(
      returnRequest(
        "?payment_id=sdk_order_123",
        `${ACCESS_COOKIE}=good-token; ${PENDING_PAYMENT_COOKIE}=sdk_order_123`
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/account/1001?new=1");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ payment_id: "sdk_order_123" });

    expect(response.headers.get("set-cookie")).toContain(`${PENDING_PAYMENT_COOKIE}=;`);
  });

  it("falls back to the pending-payment cookie when Pokpay returns without the id", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { order: provisionedOrder } }, 201)
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await checkoutReturn(
      returnRequest("", `${ACCESS_COOKIE}=good-token; ${PENDING_PAYMENT_COOKIE}=sdk_order_123`)
    );

    expect(response.status).toBe(303);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ payment_id: "sdk_order_123" });
  });

  it("sends the buyer to the failure page when the payment did not complete", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Payment has not succeeded" }, 402))
    );

    const response = await checkoutReturn(
      returnRequest(
        "?payment_id=sdk_order_123",
        `${ACCESS_COOKIE}=good-token; ${PENDING_PAYMENT_COOKIE}=sdk_order_123`
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/checkout/failed");
    expect(response.headers.get("location")).toContain("reason=unpaid");
  });

  it("never claims the card was untouched when provisioning fails for another reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Provider unavailable" }, 502))
    );

    const response = await checkoutReturn(
      returnRequest(
        "?payment_id=sdk_order_123",
        `${ACCESS_COOKIE}=good-token; ${PENDING_PAYMENT_COOKIE}=sdk_order_123`
      )
    );

    expect(response.headers.get("location")).toContain("reason=provisioning");
    expect(response.headers.get("location")).not.toContain("reason=unpaid");
  });

  it("sends the buyer somewhere sensible when there is no payment reference at all", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await checkoutReturn(returnRequest("", `${ACCESS_COOKIE}=good-token`));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("reason=missing_payment");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

