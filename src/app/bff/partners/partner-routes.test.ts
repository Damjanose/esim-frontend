import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE } from "@/lib/session";
import { POST as postPartnerRequest } from "./request/route";
import { GET as getPartnerMe } from "./me/route";
import { GET as getPartnerDashboard } from "./me/dashboard/route";
import { GET as getPartnerPayouts } from "./me/payouts/route";
import { POST as postWalletTopup } from "./me/wallet/topup/route";
import { POST as postWalletTransfer } from "./me/wallet/transfer/route";
import { POST as postPurchase } from "./me/purchase/route";
import { POST as postWithdraw } from "./me/withdraw/route";
import { POST as postVerification } from "./me/verification/route";
import { PATCH as patchDiscount } from "./me/discount/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const signedIn = `${ACCESS_COOKIE}=good-token`;

function getRequest(path: string) {
  return new Request(`http://localhost:3000${path}`, { headers: { cookie: signedIn } });
}

function postRequest(path: string, body: unknown) {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: signedIn },
    body: JSON.stringify(body)
  });
}

function patchRequest(path: string, body: unknown) {
  return new Request(`http://localhost:3000${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie: signedIn },
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

describe("POST /bff/partners/request", () => {
  it("forwards the partner request to the backend", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { id: "p1", status: "pending" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const body = { name: "Jane", country: "US", partnerType: "individual" };
    const response = await postPartnerRequest(
      postRequest("/bff/partners/request", body)
    );

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/partners/request");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("rejects a body that is not an object before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postPartnerRequest(
      new Request("http://localhost:3000/bff/partners/request", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: signedIn },
        body: "not json"
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /bff/partners/me", () => {
  it("returns the partner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { id: "p1" } }))
    );

    const response = await getPartnerMe(getRequest("/bff/partners/me"));
    const payload = (await response.json()) as { data: { id: string } };

    expect(response.status).toBe(200);
    expect(payload.data.id).toBe("p1");
  });

  it("reports an expired session", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error" }, 401)));

    const response = await getPartnerMe(getRequest("/bff/partners/me"));

    expect(response.status).toBe(401);
  });
});

describe("GET /bff/partners/me/dashboard", () => {
  it("returns the dashboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { balanceCents: 500 } }))
    );

    const response = await getPartnerDashboard(getRequest("/bff/partners/me/dashboard"));
    const payload = (await response.json()) as { data: { balanceCents: number } };

    expect(response.status).toBe(200);
    expect(payload.data.balanceCents).toBe(500);
  });
});

describe("GET /bff/partners/me/payouts", () => {
  it("returns the payout history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { payouts: [{ id: "payout-1" }] } }))
    );

    const response = await getPartnerPayouts(getRequest("/bff/partners/me/payouts"));
    const payload = (await response.json()) as { data: { payouts: Array<{ id: string }> } };

    expect(response.status).toBe(200);
    expect(payload.data.payouts).toHaveLength(1);
  });

  it("reports an expired session", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error" }, 401)));

    const response = await getPartnerPayouts(getRequest("/bff/partners/me/payouts"));

    expect(response.status).toBe(401);
  });
});

describe("POST /bff/partners/me/wallet/topup", () => {
  it("requests a wallet top-up checkout with a positive integer amount", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "success",
        data: { paymentId: "pay_1", checkoutUrl: "https://pokpay.example/pay_1" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await postWalletTopup(
      postRequest("/bff/partners/me/wallet/topup", { amountCents: 1000 })
    );

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/payments/wallet-topups/intent");
    expect(init.method).toBe("POST");
    const sentBody = JSON.parse(String(init.body));
    expect(sentBody.amount_cents).toBe(1000);
    expect(typeof sentBody.return_url).toBe("string");
  });

  it("rejects a non-positive amount before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postWalletTopup(
      postRequest("/bff/partners/me/wallet/topup", { amountCents: 0 })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /bff/partners/me/wallet/transfer", () => {
  it("sends amountCents to the backend", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { balanceCents: 100 } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await postWalletTransfer(
      postRequest("/bff/partners/me/wallet/transfer", { amountCents: 250 })
    );

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/partners/me/wallet/transfer");
    expect(JSON.parse(String(init.body))).toEqual({ amountCents: 250 });
  });

  it("surfaces the backend's own validation message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Insufficient balance" }, 409))
    );

    const response = await postWalletTransfer(
      postRequest("/bff/partners/me/wallet/transfer", { amountCents: 999999 })
    );
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Insufficient balance");
  });
});

describe("POST /bff/partners/me/purchase", () => {
  it("sends packageId and sendAsGift to the backend", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { order: { id: "o1" } } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await postPurchase(
      postRequest("/bff/partners/me/purchase", { packageId: "pkg1", sendAsGift: true })
    );

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/partners/me/purchase");
    expect(JSON.parse(String(init.body))).toEqual({ packageId: "pkg1", sendAsGift: true });
  });
});

describe("POST /bff/partners/me/withdraw", () => {
  it("sends payoutEmail to the backend", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { id: "payout1" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await postWithdraw(
      postRequest("/bff/partners/me/withdraw", { payoutEmail: "partner@example.com" })
    );

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/partners/me/withdraw");
    expect(JSON.parse(String(init.body))).toEqual({ payoutEmail: "partner@example.com" });
  });

  it("surfaces the backend's own validation message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "payoutEmail must be a valid email address" }, 400)
      )
    );

    const response = await postWithdraw(
      postRequest("/bff/partners/me/withdraw", { payoutEmail: "not-an-email" })
    );

    expect(response.status).toBe(400);
  });
});

describe("POST /bff/partners/me/verification", () => {
  it("forwards a free-form verification object", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { verificationStatus: "submitted" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const body = { idDocumentUrl: "https://example.com/doc.png", notes: "self-employed" };
    const response = await postVerification(
      postRequest("/bff/partners/me/verification", body)
    );

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/partners/me/verification");
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("rejects an empty object before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postVerification(postRequest("/bff/partners/me/verification", {}));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a top-level array before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postVerification(postRequest("/bff/partners/me/verification", [1, 2]));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("PATCH /bff/partners/me/discount", () => {
  it("sends discountPct to the backend", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { discountPct: 10 } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await patchDiscount(
      patchRequest("/bff/partners/me/discount", { discountPct: 10 })
    );

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/partners/me/discount");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ discountPct: 10 });
  });

  it("surfaces the backend's own validation message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "discountPct must be an integer between 0 and 20" }, 400)
      )
    );

    const response = await patchDiscount(
      patchRequest("/bff/partners/me/discount", { discountPct: 99 })
    );
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("discountPct must be an integer between 0 and 20");
  });
});
