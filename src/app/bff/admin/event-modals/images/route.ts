import { NextResponse } from "next/server";
import { readAdminBearer } from "@/lib/admin-bff";
import { backendFetchFormData } from "@/lib/backend";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid multipart body" }, { status: 400 });
  }

  const result = await backendFetchFormData<unknown>("/admin/event-modals/images", {
    token: readAdminBearer(request),
    formData
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }

  return NextResponse.json({ status: "success", data: result.data });
}
