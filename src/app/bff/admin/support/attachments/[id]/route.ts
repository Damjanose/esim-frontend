import { NextResponse } from "next/server";
import { readAdminBearer } from "@/lib/admin-bff";
import { backendFetchBinary } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  const result = await backendFetchBinary(`/admin/support/attachments/${id}`, {
    token: readAdminBearer(request)
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }

  return new NextResponse(new Uint8Array(result.data.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Cache-Control": "private, max-age=300"
    }
  });
}
