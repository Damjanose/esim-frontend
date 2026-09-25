import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function DELETE(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  const result = await backendFetch<unknown>("/admin/app-version/check-ins", {
    method: "DELETE",
    token
  });

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ status: "success", data: result.data });
}
