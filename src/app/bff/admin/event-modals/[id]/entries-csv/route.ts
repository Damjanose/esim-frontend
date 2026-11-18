import { NextResponse } from "next/server";
import { readAdminBearer } from "@/lib/admin-bff";
import { backendFetchBinary } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  const result = await backendFetchBinary(`/admin/event-modals/${id}/entries.csv`, {
    token: readAdminBearer(request)
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }

  return new Response(result.data.buffer, {
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": result.data.contentDisposition ?? 'attachment; filename="entries.csv"',
      "Cache-Control": "no-store"
    }
  });
}
