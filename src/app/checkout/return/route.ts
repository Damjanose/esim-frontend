import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { applyCookies, readCookie, readSessionTokens } from "@/lib/route-response";
import { PENDING_PAYMENT_COOKIE, buildClearedPendingPaymentCookie } from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

type ProvisionedOrder = {
  id: number | string;
};

/**
 * Pokpay sends the buyer back here after checkout. This is a cross-site GET
 * navigation, which SameSite=Lax cookies still accompany — the effect is bound
 * to a single payment id and the backend already de-duplicates by payment
 * reference, so re-entry is safe.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getPublicOrigin(request);
  const paymentId =
    url.searchParams.get("payment_id")?.trim() ||
    readCookie(request, PENDING_PAYMENT_COOKIE) ||
    "";
  const packageId = url.searchParams.get("package") ?? "";

  const failed = (reason: string) => {
    const target = new URL("/checkout/failed", origin);
    target.searchParams.set("reason", reason);
    if (packageId) target.searchParams.set("package", packageId);
    if (paymentId) target.searchParams.set("payment", paymentId);
    return applyCookies(NextResponse.redirect(target, 303), [
      buildClearedPendingPaymentCookie()
    ]);
  };

  if (!paymentId) {
    return failed("missing_payment");
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ order: ProvisionedOrder }>("/payments/provision", {
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

  const target = new URL(`/account/${attempt.data.order.id}`, origin);
  target.searchParams.set("new", "1");

  return applyCookies(NextResponse.redirect(target, 303), [
    ...attempt.cookies,
    buildClearedPendingPaymentCookie()
  ]);
}
