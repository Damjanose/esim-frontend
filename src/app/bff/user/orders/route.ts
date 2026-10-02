import { backendFetch } from "@/lib/backend";
import type { OrderSummary } from "@/lib/order-groups";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export const dynamic = "force-dynamic";

/** The signed-in traveler's orders, for client islands (the AI assistant's top-up and trip chips). */
export async function GET(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ orders: OrderSummary[] }>("/orders", { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
