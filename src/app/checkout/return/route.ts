import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { applyCookies, readCookie, readSessionTokens } from "@/lib/route-response";
import {
  PENDING_PAYMENT_COOKIE,
  buildClearedPendingPaymentCookie
} from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

type ProvisionedOrder = {
  order?: { id: number | string };
};

/**
 * Pokpay sends the buyer back here after hosted plan checkout. Same shape as
 * `/account/topup/return`: a cross-site GET navigation, which SameSite=Lax
 * cookies still accompany, bound to a single payment id that the backend
 * de-duplicates by reference — so re-entry is safe.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getPublicOrigin(request);
  const pendingPaymentId = readCookie(request, PENDING_PAYMENT_COOKIE)?.trim() || "";
  const paymentId = url.searchParams.get("payment_id")?.trim() || pendingPaymentId;

  const failed = (reason: string) => {
    const target = new URL("/checkout/failed", origin);
    target.searchParams.set("reason", reason);
    if (paymentId) target.searchParams.set("payment", paymentId);
    return applyCookies(NextResponse.redirect(target, 303), [buildClearedPendingPaymentCookie()]);
  };

  if (!paymentId) {
    return failed("missing_payment");
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<ProvisionedOrder>("/payments/provision", {
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

  const orderId = attempt.data.order?.id;
  if (orderId == null) {
    return failed("provisioning");
  }

  const target = new URL(`/account/${orderId}`, origin);
  target.searchParams.set("new", "1");

  return applyCookies(NextResponse.redirect(target, 303), [
    ...attempt.cookies,
    buildClearedPendingPaymentCookie()
  ]);
}
