import { beforeEach, describe, expect, it, vi } from "vitest";

const backendFetch = vi.fn();
vi.mock("@/lib/backend", () => ({
  backendFetch: (...args: unknown[]) => backendFetch(...args),
  getClientIp: () => "1.2.3.4"
}));

import { proxyFlights } from "./flightsBff";

describe("proxyFlights", () => {
  beforeEach(() => {
    backendFetch.mockReset();
    backendFetch.mockResolvedValue({ ok: true, status: 200, data: {} });
  });

  it("forwards clientIp for uncached search", async () => {
    await proxyFlights(new Request("http://x/bff/flights/search"), "/flights/search?a=1");
    expect(backendFetch).toHaveBeenCalledWith("/flights/search?a=1", { clientIp: "1.2.3.4" });
  });

  it("does not forward clientIp on revalidated reference routes", async () => {
    await proxyFlights(new Request("http://x/bff/flights/countries"), "/flights/countries", 86400);
    const options = backendFetch.mock.calls[0][1];
    expect(options.clientIp).toBeUndefined();
    expect(options.next).toEqual({ revalidate: 86400 });
  });
});
