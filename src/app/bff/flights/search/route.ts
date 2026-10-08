import { proxyFlights } from "@/lib/flightsBff";

export const dynamic = "force-dynamic";

const FORWARDED_PARAMS = ["origin", "destination", "departDate", "returnDate", "currency"] as const;

export function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const outgoing = new URLSearchParams();
  for (const key of FORWARDED_PARAMS) {
    const value = incoming.get(key);
    if (value) outgoing.set(key, value);
  }
  return proxyFlights(request, `/flights/search?${outgoing.toString()}`);
}
