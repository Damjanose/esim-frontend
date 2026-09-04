import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

type ProvisionedOrder = {
  id: number | string;
};

export async function POST(request: Request) {
  let body: { payment_id?: unknown };
  try {
    body = (await request.json()) as { payment_id?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const paymentId = typeof body.payment_id === "string" ? body.payment_id.trim() : "";
  if (!paymentId) {
    return errorJson("payment_id is required", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ order: ProvisionedOrder }>("/payments/provision", {
      method: "POST",
      body: { payment_id: paymentId },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
