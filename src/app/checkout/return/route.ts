import { NextResponse } from "next/server";
import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { reportServerError } from "@/lib/report-server-error";
import { siteUrl } from "@/lib/site-host";
import { getPublicOrigin } from "@/lib/public-origin";
import { applyCookies, readCookie, readSessionTokens } from "@/lib/route-response";
import {
  ACCESS_COOKIE,
  PENDING_PAYMENT_COOKIE,
  buildClearedPendingPaymentCookie,
  type CookieSpec
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

  const tokens = readSessionTokens(request);

  // Every failure lands in /xerrors with its reference id, which the failed page
  // shows so support can find the event. Scenario/stage: checkout_return/<reason>.
  const failed = async (
    reason: string,
    backend?: { status: number; message: string; code?: string },
    sessionCookies: CookieSpec[] = []
  ) => {
    // A refresh during this call rotated the tokens; report with the new access token and
    // hand the new cookies to the browser (refresh is stateless, so dropping them only
    // costs the buyer's next request an extra refresh).
    const refreshed = sessionCookies.find((cookie) => cookie.name === ACCESS_COOKIE)?.value;
    const { referenceId } = await reportServerError(
      request,
      {
        kind: "client_error",
        scenario: "checkout_return",
        stage: reason,
        screen: "/checkout/return",
        message: backend?.message ?? `Checkout return failed: ${reason}`,
        paymentReference: paymentId || undefined,
        failedRequest: backend
          ? {
              method: "POST",
              url: `${siteUrl}/api/payments/provision`,
              path: "/payments/provision",
              body: { payment_id: paymentId },
              status: backend.status,
              response: { status: "error", message: backend.message, ...(backend.code ? { code: backend.code } : {}) }
            }
          : undefined,
        extra: { reason, paymentIdSource: url.searchParams.get("payment_id") ? "query" : "cookie" }
      },
      refreshed || tokens.accessToken
    );
    const target = new URL("/checkout/failed", origin);
    target.searchParams.set("reason", reason);
    if (paymentId) target.searchParams.set("payment", paymentId);
    target.searchParams.set("ref", referenceId);
    return applyCookies(NextResponse.redirect(target, 303), [
      ...sessionCookies,
      buildClearedPendingPaymentCookie()
    ]);
  };

  if (!paymentId) {
    return failed("missing_payment");
  }

  const attempt = await callWithSession(tokens, (token) =>
    backendFetch<ProvisionedOrder>("/payments/provision", {
      method: "POST",
      body: { payment_id: paymentId },
      token,
      clientUserAgent: getClientUserAgent(request)
    })
  );

  if (!attempt.ok) {
    // 402 is the only status that means the money definitively did not move.
    // Everything else may have taken payment, so the buyer must never be told
    // their card was untouched.
    return failed(
      attempt.status === 402 ? "unpaid" : "provisioning",
      { status: attempt.status, message: attempt.message, code: attempt.code },
      attempt.cookies
    );
  }

  const orderId = attempt.data.order?.id;
  if (orderId == null) {
    return failed("provisioning", undefined, attempt.cookies);
  }

  const target = new URL(`/account/${orderId}`, origin);
  target.searchParams.set("new", "1");

  return applyCookies(NextResponse.redirect(target, 303), [
    ...attempt.cookies,
    buildClearedPendingPaymentCookie()
  ]);
}
