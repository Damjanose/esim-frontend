import { NextResponse } from "next/server";
import { backendFetchBinary } from "@/lib/backend";
import { applyCookies, errorJson, readSessionTokens } from "@/lib/route-response";
import { isPlanId, isVersionParam } from "@/lib/tripPlan/logic";
import { callWithSession } from "@/lib/with-session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Streams the plan PDF (optionally one version) as a download. Purchased plans only. */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);

  const version = new URL(request.url).searchParams.get("version");
  if (version !== null && !isVersionParam(version)) {
    return errorJson("version must be a non-negative integer", 400);
  }
  const query = version === null ? "" : `?version=${version}`;

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetchBinary(`/itineraries/${id}/pdf${query}`, { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return applyCookies(
    new NextResponse(new Uint8Array(attempt.data.buffer), {
      status: 200,
      headers: {
        "Content-Type": attempt.data.contentType,
        "Content-Disposition": attempt.data.contentDisposition ?? `attachment; filename="trip-plan.pdf"`,
        "Cache-Control": "private, no-store"
      }
    }),
    attempt.cookies
  );
}
