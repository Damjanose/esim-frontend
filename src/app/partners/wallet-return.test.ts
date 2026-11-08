import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE, PENDING_WALLET_TOPUP_COOKIE } from "@/lib/session";
import { POST as startWalletTopup } from "../bff/partners/me/wallet/topup/route";
import { GET as walletReturn } from "./wallet/return/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function returnRequest(query: string, cookie: string) {
  return new Request(`http://localhost:3000/partners/wallet/return${query}`, { headers: { cookie } });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("partner wallet top-up by card", () => {
  it("remembers the payment when the checkout starts (Pokpay's return carries no id)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "success",
          data: { paymentId: "sdk_wallet_1", checkoutUrl: "https://pok.test/x", amount: 20, currency: "EUR", environment: "staging" }
        })
      )
    );
    const response = await startWalletTopup(
      new Request("http://localhost:3000/bff/partners/me/wallet/topup", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ amountCents: 2000 })
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie") ?? "").toContain(`${PENDING_WALLET_TOPUP_COOKIE}=sdk_wallet_1`);
  });

  it("credits the wallet on return and lands on the dashboard", async () => {
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
      String(url).endsWith("/payments/wallet-topups/provision")
        ? jsonResponse({ status: "success", data: { partner: { id: "p1" } } }, 201)
        : jsonResponse({ status: "success", data: { referenceId: "x" } }, 201)
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await walletReturn(
      returnRequest("", `${ACCESS_COOKIE}=good-token; ${PENDING_WALLET_TOPUP_COOKIE}=sdk_wallet_1`)
    );

    const call = fetchMock.mock.calls.find((c) => String(c[0]).endsWith("/payments/wallet-topups/provision"));
    expect(JSON.parse(String(call![1]!.body))).toEqual({ payment_id: "sdk_wallet_1" });
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/partners/dashboard");
    expect(location.searchParams.get("wallet")).toBe("credited");
    expect(response.headers.get("set-cookie") ?? "").toContain(`${PENDING_WALLET_TOPUP_COOKIE}=;`);
  });

  it("says not charged only on 402, and keeps the cookie for anything it can't confirm", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).endsWith("/client-errors")
          ? jsonResponse({ status: "success", data: { referenceId: "x" } }, 201)
          : jsonResponse({ status: "error", error: "Provider unavailable" }, 502)
      )
    );
    const unknown = await walletReturn(
      returnRequest("", `${ACCESS_COOKIE}=good-token; ${PENDING_WALLET_TOPUP_COOKIE}=sdk_wallet_1`)
    );
    expect(unknown.headers.get("location")).toContain("reason=unconfirmed");
    expect(unknown.headers.get("set-cookie") ?? "").not.toContain(`${PENDING_WALLET_TOPUP_COOKIE}=;`);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).endsWith("/client-errors")
          ? jsonResponse({ status: "success", data: { referenceId: "x" } }, 201)
          : jsonResponse({ status: "error", error: "Payment has not succeeded", code: "payment_failed" }, 402)
      )
    );
    const unpaid = await walletReturn(
      returnRequest("", `${ACCESS_COOKIE}=good-token; ${PENDING_WALLET_TOPUP_COOKIE}=sdk_wallet_1`)
    );
    expect(unpaid.headers.get("location")).toContain("reason=unpaid");
    expect(unpaid.headers.get("set-cookie") ?? "").toContain(`${PENDING_WALLET_TOPUP_COOKIE}=;`);
  });
});
