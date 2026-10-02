import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/**
 * The signed-in user's review (testimonial) and send quota. The backend owns
 * every rule (paid order, 2 per 90 days, lengths); this only proxies, and
 * passes its error `code` through so the composer can pick the right state.
 */
function noStore<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ testimonial: unknown; quota: unknown }>("/user/testimonial", { token })
  );

  if (!attempt.ok) {
    return noStore(errorJson(attempt.message, attempt.status, { code: attempt.code }, attempt.cookies));
  }

  return noStore(successJson(attempt.data, attempt.cookies));
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

  const input = body as Record<string, unknown>;

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ testimonial: unknown; quota: unknown }>("/user/testimonial", {
      method: "PUT",
      body: {
        airaloOrderId: input.airaloOrderId,
        rating: input.rating,
        body: input.body,
        displayName: input.displayName,
        consentToPublish: input.consentToPublish === true,
        locale: "en",
        platform: "web"
      },
      token
    })
  );

  if (!attempt.ok) {
    return noStore(errorJson(attempt.message, attempt.status, { code: attempt.code }, attempt.cookies));
  }

  return noStore(successJson(attempt.data, attempt.cookies));
}
