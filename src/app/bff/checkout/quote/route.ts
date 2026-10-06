import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** Backend /payments/quote: what the intent would charge now, in EUR cents. */
export type PriceQuote = {
  baseCents: number;
  partnerDiscountPct: number | null;
  partnerFinalCents: number | null;
  streakDiscountPct: number | null;
  finalCustomerPriceCents: number;
};

export async function POST(request: Request) {
  let body: { packageId?: unknown; promoCode?: unknown; orderId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const packageId = typeof body.packageId === "string" ? body.packageId.trim() : "";
  const promoCode = typeof body.promoCode === "string" ? body.promoCode.trim() : "";
  const orderId = typeof body.orderId === "string" || typeof body.orderId === "number" ? body.orderId : null;

  if (!packageId) {
    return errorJson("packageId is required", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<PriceQuote>("/payments/quote", {
      method: "POST",
      body: { packageId, ...(promoCode ? { promoCode } : {}), ...(orderId != null ? { orderId } : {}) },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
