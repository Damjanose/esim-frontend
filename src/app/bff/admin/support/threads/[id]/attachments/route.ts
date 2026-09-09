import { NextResponse } from "next/server";
import { readAdminBearer } from "@/lib/admin-bff";
import { backendFetchFormData } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid multipart body" }, { status: 400 });
  }

  const result = await backendFetchFormData<unknown>(`/admin/support/threads/${id}/attachments`, {
    token: readAdminBearer(request),
    formData
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }

  return NextResponse.json({ status: "success", data: result.data });
}
