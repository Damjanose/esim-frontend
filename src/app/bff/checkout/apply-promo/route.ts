import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

type ApplyPromoResult =
  | { applied: false }
  | { applied: true; discountPct: number; finalCustomerPriceCents: number };

export async function POST(request: Request) {
  let body: { promoCode?: unknown; packageId?: unknown };
  try {
    body = (await request.json()) as { promoCode?: unknown; packageId?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const promoCode = typeof body.promoCode === "string" ? body.promoCode.trim() : "";
  const packageId = typeof body.packageId === "string" ? body.packageId.trim() : "";

  if (!promoCode || !packageId) {
    return errorJson("promoCode and packageId are required", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<ApplyPromoResult>("/payments/apply-promo", {
      method: "POST",
      body: { promoCode, packageId },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
