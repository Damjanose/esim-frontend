import { NextResponse } from "next/server";
import { backendFetchBinary } from "@/lib/backend";
import { applyCookies, errorJson, readSessionTokens } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Streams a photo from the traveler's own conversation (the backend checks ownership). */
export async function GET(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetchBinary(`/support/attachments/${id}`, { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return applyCookies(
    new NextResponse(new Uint8Array(attempt.data.buffer), {
      status: 200,
      headers: {
        "Content-Type": attempt.data.contentType,
        "Cache-Control": "private, max-age=300"
      }
    }),
    attempt.cookies
  );
}
