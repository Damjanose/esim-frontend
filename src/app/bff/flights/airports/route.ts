import { errorJson } from "@/lib/route-response";
import { proxyFlights } from "@/lib/flightsBff";

export function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country")?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(country)) {
    return errorJson("Choose a country.", 400);
  }
  return proxyFlights(request, `/flights/airports?country=${country}`, 86400);
}
