import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn
}));

import {
  convertEurToGbp,
  formatEstimateRange,
  formatGbp,
  formatUsd,
  getDisplayRates,
  getGbpRate
} from "./exchangeRate";

function currenciesResponse(currencies: unknown[]) {
  return new Response(JSON.stringify({ status: "success", data: { base: "EUR", currencies } }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getGbpRate", () => {
  it("fetches /currencies with no-store", async () => {
    const fetchMock = vi.fn(async () =>
      currenciesResponse([{ code: "GBP", rateToEur: 0.86, updatedAt: "2026-09-12T02:00:00.000Z" }])
    );
    vi.stubGlobal("fetch", fetchMock);

    await getGbpRate();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/currencies$/),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("returns the GBP rateToEur when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        currenciesResponse([
          { code: "USD", rateToEur: 1.08, updatedAt: "2026-09-12T02:00:00.000Z" },
          { code: "GBP", rateToEur: 0.86, updatedAt: "2026-09-12T02:00:00.000Z" }
        ])
      )
    );

    await expect(getGbpRate()).resolves.toBe(0.86);
  });

  it("returns null when GBP is not in the currency list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        currenciesResponse([{ code: "USD", rateToEur: 1.08, updatedAt: "2026-09-12T02:00:00.000Z" }])
      )
    );

    await expect(getGbpRate()).resolves.toBeNull();
  });

  it("returns null on a backend outage instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 }))
    );

    await expect(getGbpRate()).resolves.toBeNull();
  });

  it("returns null when fetch itself rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );

    await expect(getGbpRate()).resolves.toBeNull();
  });
});

describe("convertEurToGbp", () => {
  it("multiplies the EUR amount by the GBP rate", () => {
    expect(convertEurToGbp(10, 0.86)).toBeCloseTo(8.6);
  });
});

describe("formatGbp", () => {
  it("formats an amount with a pound sign and two decimals", () => {
    expect(formatGbp(8.6)).toBe("£8.60");
  });
});

describe("getDisplayRates", () => {
  it("returns USD and GBP from one /currencies call", async () => {
    const fetchMock = vi.fn(async () =>
      currenciesResponse([
        { code: "USD", rateToEur: 1.08, updatedAt: "2026-10-08T02:00:00.000Z" },
        { code: "GBP", rateToEur: 0.86, updatedAt: "2026-10-08T02:00:00.000Z" },
        { code: "AED", rateToEur: 4.1, updatedAt: "2026-10-08T02:00:00.000Z" }
      ])
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDisplayRates()).resolves.toEqual({ usd: 1.08, gbp: 0.86 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns nulls on a backend outage", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));

    await expect(getDisplayRates()).resolves.toEqual({ usd: null, gbp: null });
  });

  it("ignores non-positive rates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        currenciesResponse([
          { code: "USD", rateToEur: 0, updatedAt: "2026-10-08T02:00:00.000Z" },
          { code: "GBP", rateToEur: 0.86, updatedAt: "2026-10-08T02:00:00.000Z" }
        ])
      )
    );

    await expect(getDisplayRates()).resolves.toEqual({ usd: null, gbp: 0.86 });
  });
});

describe("formatUsd", () => {
  it("formats an amount with a dollar sign and two decimals", () => {
    expect(formatUsd(4.32)).toBe("$4.32");
  });
});

describe("formatEstimateRange", () => {
  it("shows USD first (US is the first market), then GBP", () => {
    expect(formatEstimateRange(4, 17.5, { usd: 1.08, gbp: 0.86 })).toBe("~$4.32–$18.90 · ~£3.44–£15.05");
  });

  it("shows only the currencies it has a rate for", () => {
    expect(formatEstimateRange(4, 17.5, { usd: null, gbp: 0.86 })).toBe("~£3.44–£15.05");
  });

  it("collapses a single-price range", () => {
    expect(formatEstimateRange(4, 4, { usd: 1.08, gbp: null })).toBe("~$4.32");
  });

  it("returns null without any rate", () => {
    expect(formatEstimateRange(4, 17.5, { usd: null, gbp: null })).toBeNull();
  });
});
