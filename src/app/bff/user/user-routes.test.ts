import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_COOKIE,
  PENDING_PAYMENT_COOKIE,
  PENDING_TOPUP_COOKIE,
  REFRESH_COOKIE
} from "@/lib/session";
import { DELETE as deleteAccount } from "./account/route";
import { GET as getBillingAddress, PUT as putBillingAddress } from "./billing-address/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const billingAddress = {
  holdersName: "Alex Morgan",
  email: "alex@example.com",
  countryCode: "AL",
  administrativeArea: "Tirana",
  locality: "Tirana",
  address1: "12 Rruga e Kavajës",
  postalCode: "1001",
  phoneNumber: "+355691234567"
};

const signedIn = `${ACCESS_COOKIE}=good-token`;

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /bff/user/billing-address", () => {
  it("returns the stored address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { billingAddress } }))
    );

    const response = await getBillingAddress(
      new Request("http://localhost:3000/bff/user/billing-address", {
        headers: { cookie: signedIn }
      })
    );
    const payload = (await response.json()) as { data: { billingAddress: unknown } };

    expect(response.status).toBe(200);
    expect(payload.data.billingAddress).toEqual(billingAddress);
  });

  it("reports an expired session rather than an empty address", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error" }, 401)));

    const response = await getBillingAddress(
      new Request("http://localhost:3000/bff/user/billing-address", {
        headers: { cookie: signedIn }
      })
    );

    expect(response.status).toBe(401);
  });
});

describe("PUT /bff/user/billing-address", () => {
  function putRequest(body: unknown) {
    return new Request("http://localhost:3000/bff/user/billing-address", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: signedIn },
      body: JSON.stringify(body)
    });
  }

  it("saves the full billing address", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "success",
        data: { purchaseDetails: { complete: true, billingAddress, card: null } }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await putBillingAddress(putRequest(billingAddress));

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/user/billing-address");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual(billingAddress);
  });

  it("surfaces the backend's own validation message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "Billing address is incomplete" }, 400)
      )
    );

    const response = await putBillingAddress(putRequest({ ...billingAddress, locality: "" }));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Billing address is incomplete");
  });

  it("rejects a body that is not an address before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await putBillingAddress(
      new Request("http://localhost:3000/bff/user/billing-address", {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: signedIn },
        body: "not json"
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /bff/user/account", () => {
  function deleteRequest() {
    return new Request("http://localhost:3000/bff/user/account", {
      method: "DELETE",
      headers: { cookie: signedIn }
    });
  }

  it("deletes the account and clears every session cookie", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { deleted: true } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await deleteAccount(deleteRequest());

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/user/account");
    expect(init.method).toBe("DELETE");

    // Leaving any of these set would keep the browser looking signed in.
    const cookies = response.headers.getSetCookie();
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, PENDING_PAYMENT_COOKIE, PENDING_TOPUP_COOKIE]) {
      expect(cookies.some((cookie) => cookie.startsWith(`${name}=;`))).toBe(true);
    }
  });

  it("leaves the session intact when the backend refuses the deletion", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Failed to delete account" }, 500))
    );

    const response = await deleteAccount(deleteRequest());

    expect(response.status).toBe(500);
    // Signing the visitor out here would strand them: the account still exists.
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
