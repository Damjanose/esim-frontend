import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson("Invalid request body", 400);
  }

  // No fixed shape for v1 — admin reviews this manually. Only reject a body
  // that isn't a plain, non-empty object at all; the backend applies the
  // same check and owns the rest.
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body as Record<string, unknown>).length === 0
  ) {
    return errorJson("Invalid request body", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/partners/me/verification", { method: "POST", body, token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
