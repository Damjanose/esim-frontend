import { NextResponse } from "next/server";
import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { isExternalPaymentId, successPath, type ExternalPayment } from "@/lib/externalPayments";
import { getPublicOrigin } from "@/lib/public-origin";
import { reportServerError } from "@/lib/report-server-error";
import { siteUrl } from "@/lib/site-host";
import { applyCookies, readSessionTokens } from "@/lib/route-response";
import { ACCESS_COOKIE, type CookieSpec } from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

/**
 * PayPal sends the buyer back here after approving (plans and top-ups; top-ups carry
 * ?order=). We capture, which also provisions, then land where the Pokpay return routes
 * land. The backend captures each PayPal order once and provisions by payment id, so a
 * refresh or a second tab is safe.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getPublicOrigin(request);
  const paymentId = url.searchParams.get("payment_id")?.trim() ?? "";
  const topupOrderId = url.searchParams.get("order")?.trim() || null;
  const tokens = readSessionTokens(request);

  // Same reporting as /checkout/return: the reference id rides to /checkout/failed as ?ref=.
  const failed = async (
    reason: string,
    backend?: { status: number; message: string; code?: string },
    sessionCookies: CookieSpec[] = []
  ) => {
    const refreshed = sessionCookies.find((cookie) => cookie.name === ACCESS_COOKIE)?.value;
    const { referenceId } = await reportServerError(
      request,
      {
        kind: "client_error",
        scenario: "paypal_return",
        stage: reason,
        screen: "/checkout/paypal/return",
        message: backend?.message ?? `PayPal return failed: ${reason}`,
        paymentReference: paymentId || undefined,
        failedRequest: backend
          ? {
              method: "POST",
              url: `${siteUrl}/api/payments/paypal/capture`,
              path: "/payments/paypal/capture",
              body: { payment_id: paymentId },
              status: backend.status,
              response: { status: "error", message: backend.message, ...(backend.code ? { code: backend.code } : {}) }
            }
          : undefined,
        extra: { reason, topup: Boolean(topupOrderId) }
      },
      refreshed || tokens.accessToken
    );
    const target = new URL("/checkout/failed", origin);
    target.searchParams.set("reason", reason);
    if (paymentId) target.searchParams.set("payment", paymentId);
    target.searchParams.set("ref", referenceId);
    return applyCookies(NextResponse.redirect(target, 303), sessionCookies);
  };

  if (!isExternalPaymentId(paymentId)) {
    return failed("missing_payment");
  }

  const attempt = await callWithSession(tokens, (token) =>
    backendFetch<ExternalPayment>("/payments/paypal/capture", {
      method: "POST",
      body: { payment_id: paymentId },
      token,
      clientUserAgent: getClientUserAgent(request)
    })
  );

  if (!attempt.ok) {
    // 402 = PayPal declined: no money moved. payment_not_settled = PayPal is still
    // holding it (e.g. under review); the webhook finishes the order later.
    const reason =
      attempt.status === 402 ? "unpaid" : attempt.code === "payment_not_settled" ? "pending" : "provisioning";
    return failed(reason, { status: attempt.status, message: attempt.message, code: attempt.code }, attempt.cookies);
  }

  const path = successPath(attempt.data, topupOrderId);
  if (!path) return failed("provisioning", undefined, attempt.cookies);
  return applyCookies(NextResponse.redirect(new URL(path, origin), 303), attempt.cookies);
}
