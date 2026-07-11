import { NextResponse } from "next/server";

const DEFAULT_BACKEND_API_URL = "https://esim.uplisoft.com/api";
const LOCAL_BACKEND_API_URL = "http://127.0.0.1:4000/api";

function getBackendApiUrl() {
  const configuredUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  if (process.env.NODE_ENV === "development") {
    return LOCAL_BACKEND_API_URL;
  }

  return (
    DEFAULT_BACKEND_API_URL
  ).replace(/\/$/, "");
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("Authorization") ?? "";
    const response = await fetch(`${getBackendApiUrl()}/admin/dashboard`, {
      headers: { Authorization: authorization },
      cache: "no-store"
    });
    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to load admin dashboard" },
      { status: 502 }
    );
  }
}
