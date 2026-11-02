import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** Sends one traveler message (text and/or previously uploaded attachment ids, optionally a reply, optionally the order the chat was opened from). */
export async function POST(request: Request) {
  let body: { body?: unknown; attachmentIds?: unknown; replyToId?: unknown; order_id?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid JSON body", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<unknown>("/support/messages", {
      method: "POST",
      token,
      body: { body: body.body, attachmentIds: body.attachmentIds, replyToId: body.replyToId, order_id: body.order_id }
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
