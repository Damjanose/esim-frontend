import { NextResponse } from "next/server";
import { backendFetchBinary } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Public: the backend image route is unauthenticated, so no admin token is forwarded. */
export async function GET(_request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  const result = await backendFetchBinary(`/event-modals/images/${id}`);

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: 404 });
  }

  return new Response(result.data.buffer, {
    headers: {
      "Content-Type": result.data.contentType,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
