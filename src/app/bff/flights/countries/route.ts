import { proxyFlights } from "@/lib/flightsBff";

export function GET(request: Request) {
  return proxyFlights(request, "/flights/countries", 86400);
}
