import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const result = await backendFetch<{ testimonials?: unknown[] }>("/testimonials", {
    next: { revalidate: 60 }
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", error: result.message }, { status: result.status });
  }

  return NextResponse.json(
    { status: "success", data: result.data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    }
  );
}
