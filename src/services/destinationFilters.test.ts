import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESTINATION_FILTERS,
  isDestinationFiltersActive,
  matchesDestinationFilters,
  parseDestinationFiltersFromParams,
  wizardFiltersToQueryParams,
} from "./destinationFilters";
import type { HeroPackageOption } from "./packages";

function plan(overrides: Partial<HeroPackageOption> = {}): HeroPackageOption {
  return {
    kind: "standard",
    id: "pkg-1",
    country: "Spain",
    countryCode: "spain",
    flagUri: "",
    dataLabel: "10 GB",
    durationLabel: "15 Days Duration",
    title: "10 GB - 15 days",
    price: "€8.00",
    priceNumeric: 8,
    dataNumericGb: 10,
    durationDays: 15,
    filters: ["local"],
    query: "",
    ...overrides,
  };
}

describe("matchesDestinationFilters", () => {
  it("matches everything against the default (no-op) filters", () => {
    expect(matchesDestinationFilters(plan(), DEFAULT_DESTINATION_FILTERS)).toBe(true);
  });

  it("excludes unlimited plans when includeUnlimited is false, regardless of data range", () => {
    const unlimitedPlan = plan({ dataNumericGb: 999 });
    expect(
      matchesDestinationFilters(unlimitedPlan, {
        ...DEFAULT_DESTINATION_FILTERS,
        includeUnlimited: false,
      }),
    ).toBe(false);
  });

  it("ignores the data range for unlimited plans when includeUnlimited is true", () => {
    const unlimitedPlan = plan({ dataNumericGb: 999 });
    expect(
      matchesDestinationFilters(unlimitedPlan, {
        ...DEFAULT_DESTINATION_FILTERS,
        dataFromGb: 1,
        dataToGb: 5,
      }),
    ).toBe(true);
  });

  it("excludes a finite plan outside the data range", () => {
    expect(
      matchesDestinationFilters(plan({ dataNumericGb: 20 }), {
        ...DEFAULT_DESTINATION_FILTERS,
        dataFromGb: 1,
        dataToGb: 5,
      }),
    ).toBe(false);
  });

  it("excludes a plan outside the day range", () => {
    expect(
      matchesDestinationFilters(plan({ durationDays: 5 }), {
        ...DEFAULT_DESTINATION_FILTERS,
        daysFrom: 30,
      }),
    ).toBe(false);
  });
});

describe("isDestinationFiltersActive", () => {
  it("is false for the default filters", () => {
    expect(isDestinationFiltersActive(DEFAULT_DESTINATION_FILTERS)).toBe(false);
  });

  it("is true once any constraint is set", () => {
    expect(
      isDestinationFiltersActive({ ...DEFAULT_DESTINATION_FILTERS, daysFrom: 7 }),
    ).toBe(true);
  });
});

describe("parseDestinationFiltersFromParams", () => {
  it("parses numeric params and defaults unlimited to true when absent", () => {
    expect(
      parseDestinationFiltersFromParams({
        daysMin: "30",
        dataMin: "20",
        dataMax: undefined,
      }),
    ).toEqual({
      daysFrom: 30,
      daysTo: null,
      dataFromGb: 20,
      dataToGb: null,
      includeUnlimited: true,
    });
  });

  it("only treats an explicit unlimited=false as excluding unlimited plans", () => {
    expect(parseDestinationFiltersFromParams({ unlimited: "false" }).includeUnlimited).toBe(
      false,
    );
    expect(parseDestinationFiltersFromParams({ unlimited: "true" }).includeUnlimited).toBe(true);
    expect(parseDestinationFiltersFromParams({}).includeUnlimited).toBe(true);
  });

  it("falls back to null for malformed numeric params rather than throwing", () => {
    expect(parseDestinationFiltersFromParams({ daysMin: "not-a-number" }).daysFrom).toBeNull();
  });
});

describe("wizardFiltersToQueryParams", () => {
  it("round-trips a preset days + finite data bucket answer through parseDestinationFiltersFromParams", () => {
    const params = wizardFiltersToQueryParams({
      days: { kind: "preset", days: 30 },
      data: { kind: "range", fromGb: 20, toGb: null },
    });

    const parsed = parseDestinationFiltersFromParams(Object.fromEntries(params));

    expect(parsed).toEqual({
      daysFrom: 30,
      daysTo: 30,
      dataFromGb: 20,
      dataToGb: null,
      includeUnlimited: false,
    });
  });

  it("encodes an unlimited data answer so only unlimited plans pass the filter", () => {
    const params = wizardFiltersToQueryParams({
      days: { kind: "any" },
      data: { kind: "unlimited" },
    });

    const parsed = parseDestinationFiltersFromParams(Object.fromEntries(params));

    expect(parsed.includeUnlimited).toBe(true);
    expect(matchesDestinationFilters(
      { dataNumericGb: 999, durationDays: 10 } as unknown as Parameters<typeof matchesDestinationFilters>[0],
      parsed,
    )).toBe(true);
    expect(matchesDestinationFilters(
      { dataNumericGb: 50, durationDays: 10 } as unknown as Parameters<typeof matchesDestinationFilters>[0],
      parsed,
    )).toBe(false);
  });

  it("produces no params for an all-'any' answer", () => {
    const params = wizardFiltersToQueryParams({
      days: { kind: "any" },
      data: { kind: "any" },
    });

    expect(Array.from(params.entries())).toEqual([]);
  });
});
