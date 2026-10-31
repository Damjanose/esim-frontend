import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";
import type { PendingPayment } from "@/lib/pendingPayments";

export const dynamic = "force-dynamic";

/** Paid-but-not-yet-provisioned payments for the signed-in traveler. */
export async function GET(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ pending: PendingPayment[] }>("/orders/pending-payments", { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
