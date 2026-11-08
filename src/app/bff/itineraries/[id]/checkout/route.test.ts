import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE } from "@/lib/session";
import { WEB_PURCHASES_DISABLED_MESSAGE } from "@/lib/web-purchases";
import { POST } from "./route";

const PLAN_ID = "11111111-1111-4111-8111-111111111111";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function unlock() {
  return POST(
    new Request(`http://localhost:3000/bff/itineraries/${PLAN_ID}/checkout`, {
      method: "POST",
      headers: { cookie: `${ACCESS_COOKIE}=good-token` }
    }),
    { params: Promise.resolve({ id: PLAN_ID }) }
  );
}

beforeEach(() => vi.stubEnv("NODE_ENV", "development"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /bff/itineraries/[id]/checkout (web purchases disabled)", () => {
  it("passes a free unlock through", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "success", data: { free: true } })));
    const response = await unlock();
    expect(response.status).toBe(200);
  });

  it("refuses a paid unlock with 403 and never hands out the payment id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { paymentId: "pay_1", environment: "staging" } }))
    );
    const response = await unlock();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ status: "error", error: WEB_PURCHASES_DISABLED_MESSAGE });
    expect(JSON.stringify(body)).not.toContain("pay_1");
  });
});
