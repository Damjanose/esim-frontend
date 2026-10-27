import { NextResponse } from "next/server";
import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { reportServerError } from "@/lib/report-server-error";
import { siteUrl } from "@/lib/site-host";
import { applyCookies, readCookie, readSessionTokens } from "@/lib/route-response";
import {
  ACCESS_COOKIE,
  PENDING_TOPUP_COOKIE,
  buildClearedPendingTopupCookie,
  parsePendingTopupCookie,
  type CookieSpec
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

  const tokens = readSessionTokens(request);

  // Reported to /xerrors (scenario topup_return, stage = reason); the reference id rides to
  // /checkout/failed as ?ref=. Applying the refreshed session cookies avoids an extra
  // refresh on the buyer's next request; the report uses the refreshed access token.
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
        scenario: "topup_return",
        stage: reason,
        screen: "/account/topup/return",
        message: backend?.message ?? `Top-up return failed: ${reason}`,
        paymentReference: paymentId || undefined,
        orderId: pending.orderId ? String(pending.orderId) : undefined,
        failedRequest: backend
          ? {
              method: "POST",
              url: `${siteUrl}/api/payments/topups/provision`,
              path: "/payments/topups/provision",
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
    return applyCookies(NextResponse.redirect(target, 303), [
      ...sessionCookies,
      buildClearedPendingTopupCookie()
    ]);
  };

  if (!paymentId) {
    return failed("missing_payment");
  }

  const attempt = await callWithSession(tokens, (token) =>
    backendFetch<ProvisionedTopup>("/payments/topups/provision", {
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
