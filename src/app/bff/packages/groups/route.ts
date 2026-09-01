import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const result = await backendFetch<{
    popular?: unknown[];
    bestValue?: unknown[];
    unlimited?: unknown[];
    longStay?: unknown[];
  }>("/packages/groups");

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", error: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ status: "success", data: result.data });
}
