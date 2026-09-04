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
  it("asks the backend for a checkout url and remembers the payment id", async () => {
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
    expect(payload.data.checkoutUrl).toBe(paymentSession.checkoutUrl);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(String(init.body));
    expect(sent.package_id).toBe("hej-telecom-in-30days-20gb");
    expect(sent.return_url).toBe("http://localhost:3000/checkout/return");

    const pending = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(`${PENDING_PAYMENT_COOKIE}=`));
    expect(pending).toContain("sdk_order_123");
    expect(pending).toContain("HttpOnly");
  });

  it("builds the return url from the public host, not the server bind address", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: paymentSession }));
    vi.stubGlobal("fetch", fetchMock);

    // Next resolves request.url from the bind address, so a deployed site would
    // otherwise send Pokpay a localhost return_url the allowlist must reject.
    await createIntent(
      new Request("http://localhost:3000/bff/payments/intent", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${ACCESS_COOKIE}=good-token`,
          "x-forwarded-host": "esim.uplisoft.com",
          "x-forwarded-proto": "https"
        },
        body: JSON.stringify({ package_id: "hej-telecom-in-30days-20gb" })
      })
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).return_url).toBe(
      "https://esim.uplisoft.com/checkout/return"
    );
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
  function returnRequest(query: string, cookie: string) {
    return new Request(`http://localhost:3000/checkout/return${query}`, {
      method: "GET",
      headers: { cookie }
    });
  }

  it("provisions the order and sends the buyer to their new eSIM", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { order: provisionedOrder } }, 201))
    );

    const response = await checkoutReturn(
      returnRequest(
        "?payment_id=sdk_order_123",
        `${ACCESS_COOKIE}=good-token; ${PENDING_PAYMENT_COOKIE}=sdk_order_123`
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/account/1001?new=1");
    expect(
      response.headers
        .getSetCookie()
        .some((cookie) => cookie.startsWith(`${PENDING_PAYMENT_COOKIE}=;`))
    ).toBe(true);
  });

  it("falls back to the pending cookie when Pokpay returns without the id", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { order: provisionedOrder } }, 201)
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await checkoutReturn(
      returnRequest("", `${ACCESS_COOKIE}=good-token; ${PENDING_PAYMENT_COOKIE}=sdk_order_123`)
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).payment_id).toBe("sdk_order_123");
    expect(response.headers.get("location")).toBe("http://localhost:3000/account/1001?new=1");
  });

  it("lands on the same order when the return url is opened twice", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { order: provisionedOrder } }, 201))
    );

    const first = await checkoutReturn(
      returnRequest("?payment_id=sdk_order_123", `${ACCESS_COOKIE}=good-token`)
    );
    const second = await checkoutReturn(
      returnRequest("?payment_id=sdk_order_123", `${ACCESS_COOKIE}=good-token`)
    );

    expect(first.headers.get("location")).toBe(second.headers.get("location"));
  });

  it("reports an unpaid payment as a genuine payment failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Payment is not completed" }, 402))
    );

    const response = await checkoutReturn(
      returnRequest(
        "?payment_id=sdk_order_123&package=hej-telecom-in-30days-20gb",
        `${ACCESS_COOKIE}=good-token`
      )
    );

    const location = new URL(String(response.headers.get("location")));
    expect(location.pathname).toBe("/checkout/failed");
    expect(location.searchParams.get("reason")).toBe("unpaid");
  });

  it("never claims the card was untouched when provisioning fails after payment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Provider unavailable" }, 502))
    );

    const response = await checkoutReturn(
      returnRequest("?payment_id=sdk_order_123", `${ACCESS_COOKIE}=good-token`)
    );

    const location = new URL(String(response.headers.get("location")));
    expect(location.pathname).toBe("/checkout/failed");
    expect(location.searchParams.get("reason")).toBe("provisioning");
    // The payment reference must survive so support can trace the charge.
    expect(location.searchParams.get("payment")).toBe("sdk_order_123");
  });

  it("sends the visitor to sign-in when the payment reference is missing entirely", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await checkoutReturn(returnRequest("", `${ACCESS_COOKIE}=good-token`));

    expect(fetchMock).not.toHaveBeenCalled();
    const location = new URL(String(response.headers.get("location")));
    expect(location.pathname).toBe("/checkout/failed");
    expect(location.searchParams.get("reason")).toBe("missing_payment");
  });
});
