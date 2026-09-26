import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn
}));

import {
  getDestinationCoverage,
  getDestinationOffer,
  getDestinationPlanRows
} from "./destinationPricing";

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
      highPrice: 19.5,
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
      highPrice: 12,
      currency: "EUR",
      offerCount: 1
    });
  });
});

describe("destination SEO pages", () => {
  it("keep hourly ISR without putting /api/packages in the Next data cache", () => {
    const pricing = readFileSync("src/lib/destinationPricing.ts", "utf8");
    const page = readFileSync("src/app/esim/[slug]/page.tsx", "utf8");

    expect(pricing).toContain('cache: "no-store"');
    expect(pricing).toContain("unstable_cache");
    expect(pricing).not.toContain("next: { revalidate: 3600 }");
    expect(page).toContain("export const revalidate = 3600");
    expect(page).toContain("getDestinationPlanRows");
  });
});

describe("getDestinationPlanRows", () => {
  it("returns priced rows for the destination slug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        packagesResponse([
          {
            id: "jp-1",
            countryCode: "japan",
            title: "3 GB · 7 days",
            dataLabel: "3 GB",
            durationLabel: "7 days",
            price: "€9.89",
            priceNumeric: 9.89
          }
        ])
      )
    );

    await expect(getDestinationPlanRows("japan")).resolves.toEqual([
      expect.objectContaining({
        id: "jp-1",
        dataLabel: "3 GB",
        durationLabel: "7 days",
        priceNumeric: 9.89,
        network: "4G/5G"
      })
    ]);
  });
});

describe("getDestinationCoverage", () => {
  const europe = (countries: string[], price: number) => ({
    countryCode: "europe",
    priceNumeric: price,
    countries: countries.map((title) => ({ title }))
  });

  it("lists only the countries every regional plan covers, sorted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        packagesResponse([
          europe(["Serbia", "Albania", "Greece"], 3),
          europe(["Albania", "Serbia"], 5)
        ])
      )
    );

    // /esim/balkans is served by the backend `europe` plans.
    await expect(getDestinationCoverage("balkans")).resolves.toEqual(["Albania", "Serbia"]);
  });

  it("returns nothing for single-country destinations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        packagesResponse([
          { countryCode: "japan", priceNumeric: 4, countries: [{ title: "Japan" }] }
        ])
      )
    );

    await expect(getDestinationCoverage("japan")).resolves.toEqual([]);
  });
});
