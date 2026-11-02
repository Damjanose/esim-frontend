import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  // ?country_code=XX asks the backend for the country-filtered list, which also carries
  // plan details (activation, networks, fair usage). Anything but a 2-letter code is ignored.
  const countryCode = new URL(request.url).searchParams.get("country_code")?.trim() ?? "";
  const query = /^[A-Za-z]{2}$/.test(countryCode) ? `?country_code=${countryCode.toUpperCase()}` : "";
  const result = await backendFetch<{ packages?: unknown[] }>(`/packages${query}`, {
    next: { revalidate: 60 }
  });

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", error: result.message },
      { status: result.status }
    );
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
