import { NextResponse } from "next/server";
import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { isRetryableReturnReason, paymentReturnFailureReason } from "@/lib/externalPayments";
import { getPublicOrigin } from "@/lib/public-origin";
import { reportServerError } from "@/lib/report-server-error";
import { siteUrl } from "@/lib/site-host";
import { applyCookies, readCookie, readSessionTokens } from "@/lib/route-response";
import {
  ACCESS_COOKIE,
  PENDING_WALLET_TOPUP_COOKIE,
  buildClearedPendingWalletTopupCookie,
  type CookieSpec
} from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

/**
 * Pokpay sends a partner back here after topping up their wallet by card. Nothing else
 * credits the wallet (there is no Pokpay webhook), so this provisions it: the backend
 * credits by payment reference exactly once (unique wallet transaction), so a refresh or
 * a second tab is safe. Same shape as `/account/topup/return`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getPublicOrigin(request);
  const paymentId =
    url.searchParams.get("payment_id")?.trim() || readCookie(request, PENDING_WALLET_TOPUP_COOKIE)?.trim() || "";
  const tokens = readSessionTokens(request);

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
        scenario: "wallet_topup_return",
        stage: reason,
        screen: "/partners/wallet/return",
        message: backend?.message ?? `Wallet top-up return failed: ${reason}`,
        paymentReference: paymentId || undefined,
        failedRequest: backend
          ? {
              method: "POST",
              url: `${siteUrl}/api/payments/wallet-topups/provision`,
              path: "/payments/wallet-topups/provision",
              body: { payment_id: paymentId },
              status: backend.status,
              response: { status: "error", message: backend.message, ...(backend.code ? { code: backend.code } : {}) }
            }
          : undefined,
        extra: { reason }
      },
      refreshed || tokens.accessToken
    );
    const target = new URL("/checkout/failed", origin);
    target.searchParams.set("reason", reason);
    if (paymentId) target.searchParams.set("payment", paymentId);
    target.searchParams.set("ref", referenceId);
    if (reason === "signin" && paymentId) {
      target.searchParams.set("resume", `/partners/wallet/return?payment_id=${encodeURIComponent(paymentId)}`);
    }
    return applyCookies(NextResponse.redirect(target, 303), [
      ...sessionCookies,
      ...(isRetryableReturnReason(reason) ? [] : [buildClearedPendingWalletTopupCookie()])
    ]);
  };

  if (!paymentId) {
    return failed("missing_payment");
  }

  const attempt = await callWithSession(tokens, (token) =>
    backendFetch<{ partner?: unknown }>("/payments/wallet-topups/provision", {
      method: "POST",
      body: { payment_id: paymentId },
      token,
      clientUserAgent: getClientUserAgent(request)
    })
  );

  if (!attempt.ok) {
    return failed(
      paymentReturnFailureReason(attempt.status, attempt.code),
      { status: attempt.status, message: attempt.message, code: attempt.code },
      attempt.cookies
    );
  }

  const target = new URL("/partners/dashboard", origin);
  target.searchParams.set("wallet", "credited");
  return applyCookies(NextResponse.redirect(target, 303), [
    ...attempt.cookies,
    buildClearedPendingWalletTopupCookie()
  ]);
}
