import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** Sends one traveler message (text and/or previously uploaded attachment ids). */
export async function POST(request: Request) {
  let body: { body?: unknown; attachmentIds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid JSON body", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/support/messages", {
      method: "POST",
      token,
      body: { body: body.body, attachmentIds: body.attachmentIds }
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
