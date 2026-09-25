import { backendFetch } from "@/lib/backend";
import { applyCookies, errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { buildPendingPaymentCookie } from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

type PaymentSession = {
  paymentId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  environment: string;
  expiresAt?: string;
};

export async function POST(request: Request) {
  let body: { package_id?: unknown; promo_code?: unknown };
  try {
    body = (await request.json()) as { package_id?: unknown; promo_code?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const packageId = typeof body.package_id === "string" ? body.package_id.trim() : "";
  if (!packageId) {
    return errorJson("Choose a plan before paying.", 400);
  }

  // Optional: omitted from the backend call entirely when absent, rather than
  // sent as an empty string — the backend's own /intent route only treats a
  // non-empty promoCode as present (see routes/payments.ts nonEmptyString).
  const promoCode = typeof body.promo_code === "string" ? body.promo_code.trim() : "";

  // Plan checkout is in-page CardStep / usePOK — no Pokpay hosted redirect, so
  // do not send return_url. Sending localhost (or any non-allowlisted origin)
  // against production yields "return_url origin is not allowed" before the
  // card form can load. Mobile omits return_url the same way; the backend then
  // falls back to its app deep-link default for Pokpay's unused redirect fields.
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<PaymentSession>("/payments/intent", {
      method: "POST",
      body: {
        package_id: packageId,
        ...(promoCode ? { promoCode } : {})
      },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  // Keep a local reference in case provision needs it after pay.
  return applyCookies(successJson(attempt.data, attempt.cookies), [
    buildPendingPaymentCookie(attempt.data.paymentId)
  ]);
}
