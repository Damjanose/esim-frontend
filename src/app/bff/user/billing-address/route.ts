import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export type BillingAddress = {
  line1: string;
  city: string;
  postal: string;
  country: string;
};

export async function GET(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ billingAddress: BillingAddress | null }>("/user/billing-address", { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson("Invalid request body", 400);
  }

  if (!body || typeof body !== "object") {
    return errorJson("Invalid request body", 400);
  }

  const address = body as Partial<BillingAddress>;

  // Field-level validation stays on the backend, which owns the rules and the
  // messages; this only rejects a body that is not an address at all.
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ purchaseDetails: unknown }>("/user/billing-address", {
      method: "PUT",
      body: {
        line1: address.line1 ?? "",
        city: address.city ?? "",
        postal: address.postal ?? "",
        country: address.country ?? ""
      },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
