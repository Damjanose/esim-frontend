import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { applyCookies, readCookie, readSessionTokens } from "@/lib/route-response";
import {
  PENDING_TOPUP_COOKIE,
  buildClearedPendingTopupCookie,
  parsePendingTopupCookie
} from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

type ProvisionedTopup = {
  topup?: Record<string, unknown>;
  alreadyProvisioned?: boolean;
};

/**
 * Pokpay sends the buyer back here after a top-up checkout. Same shape as
 * `/checkout/return`: a cross-site GET navigation, which SameSite=Lax cookies
 * still accompany, bound to a single payment id that the backend de-duplicates
 * by reference — so re-entry is safe.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getPublicOrigin(request);
  const pending = parsePendingTopupCookie(readCookie(request, PENDING_TOPUP_COOKIE));
  const paymentId = url.searchParams.get("payment_id")?.trim() || pending.paymentId || "";

  const failed = (reason: string) => {
    const target = new URL("/checkout/failed", origin);
    target.searchParams.set("reason", reason);
    if (paymentId) target.searchParams.set("payment", paymentId);
    return applyCookies(NextResponse.redirect(target, 303), [buildClearedPendingTopupCookie()]);
  };

  if (!paymentId) {
    return failed("missing_payment");
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<ProvisionedTopup>("/payments/topups/provision", {
      method: "POST",
      body: { payment_id: paymentId },
      token
    })
  );

  if (!attempt.ok) {
    // 402 is the only status that means the money definitively did not move.
    // Everything else may have taken payment, so the buyer must never be told
    // their card was untouched.
    return failed(attempt.status === 402 ? "unpaid" : "provisioning");
  }

  // The provisioning response describes the provider's top-up, not our order, so
  // the eSIM to return to comes from the cookie set when the intent was created.
  const target = pending.orderId
    ? new URL(`/account/${pending.orderId}`, origin)
    : new URL("/account", origin);
  target.searchParams.set("topup", "1");

  return applyCookies(NextResponse.redirect(target, 303), [
    ...attempt.cookies,
    buildClearedPendingTopupCookie()
  ]);
}
