import { NextResponse } from "next/server";

const DEFAULT_BACKEND_API_URL = "https://esim.uplisoft.com/api";

function getBackendApiUrl() {
  return (
    process.env.PACKAGES_API_URL ??
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_BACKEND_API_URL
  ).replace(/\/$/, "");
}

export async function GET() {
  try {
    const response = await fetch(`${getBackendApiUrl()}/packages`, {
      cache: "no-store",
    });
    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { status: "error", error: "Failed to fetch packages" },
      { status: 502 },
    );
  }
}
