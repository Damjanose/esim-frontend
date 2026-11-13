import { NextResponse } from "next/server";
import { readAdminBearer } from "@/lib/admin-bff";
import { backendFetchBinary } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ account: string; uid: string; partId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { account, uid, partId } = await context.params;
  const folder = new URL(request.url).searchParams.get("folder")?.trim();
  const base = `/admin/mail/${encodeURIComponent(account)}/messages/${encodeURIComponent(uid)}/attachments/${encodeURIComponent(partId)}`;
  const path = folder ? `${base}?folder=${encodeURIComponent(folder)}` : base;

  const result = await backendFetchBinary(path, { token: readAdminBearer(request) });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }

  const disposition = result.data.contentDisposition;
  return new NextResponse(new Uint8Array(result.data.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Cache-Control": "private, max-age=300",
      ...(disposition ? { "Content-Disposition": disposition } : {})
    }
  });
}
