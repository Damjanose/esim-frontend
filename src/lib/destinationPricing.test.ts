import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn
}));

import { getDestinationOffer } from "./destinationPricing";

function packagesResponse(packages: unknown[]) {
  return new Response(JSON.stringify({ status: "success", data: { packages } }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getDestinationOffer", () => {
  it("fetches /packages with no-store so Next does not cache the 2MB+ catalog", async () => {
    const fetchMock = vi.fn(async () =>
      packagesResponse([{ countryCode: "japan", priceNumeric: 9.89 }])
    );
    vi.stubGlobal("fetch", fetchMock);

    await getDestinationOffer("japan");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/packages$/),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("returns the lowest priceNumeric for the destination slug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        packagesResponse([
          { countryCode: "japan", priceNumeric: 19.5 },
          { countryCode: "japan", priceNumeric: 9.89 },
          { countryCode: "france", priceNumeric: 4 }
        ])
      )
    );

    await expect(getDestinationOffer("japan")).resolves.toEqual({
      lowPrice: 9.89,
      currency: "EUR",
      offerCount: 2
    });
  });

  it("maps usa/uk/uae slugs onto the backend countryCode values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        packagesResponse([{ countryCode: "united-states", priceNumeric: 12 }])
      )
    );

    await expect(getDestinationOffer("usa")).resolves.toEqual({
      lowPrice: 12,
      currency: "EUR",
      offerCount: 1
    });
  });
});

describe("destination SEO pages", () => {
  it("keep hourly ISR without putting /api/packages in the Next data cache", () => {
    const pricing = readFileSync("src/lib/destinationPricing.ts", "utf8");
    const page = readFileSync("src/app/destinations/[slug]/page.tsx", "utf8");

    expect(pricing).toContain('cache: "no-store"');
    expect(pricing).toContain("unstable_cache");
    expect(pricing).not.toContain("next: { revalidate: 3600 }");
    expect(page).toContain("export const revalidate = 3600");
  });
});
