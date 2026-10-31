import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { readAdminBearer } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function pick(payload: Record<string, unknown> | undefined, key: string): unknown {
  const nested = payload?.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : undefined;
  return payload?.[key] ?? nested?.[key];
}

/**
 * Reopens a solved thread. Unlike the other admin proxies it keeps the 409 extras
 * (`code: USER_HAS_OPEN_THREAD`, `openThreadId`) so the inbox can point at the open thread.
 */
export async function POST(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  const result = await backendFetch<unknown>(`/admin/support/threads/${id}/reopen`, {
    method: "POST",
    token: readAdminBearer(request)
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        status: "error",
        message: result.message,
        code: pick(result.payload, "code") ?? null,
        openThreadId: pick(result.payload, "openThreadId") ?? null
      },
      { status: result.status }
    );
  }

  return NextResponse.json({ status: "success", data: result.data });
}
