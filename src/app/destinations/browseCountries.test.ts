import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { HeroPackageOption } from "@/services/packages";
import { toCountryOptions } from "./browseCountries";

function plan(
  overrides: Partial<HeroPackageOption> & Pick<HeroPackageOption, "id" | "country" | "countryCode">,
): HeroPackageOption {
  return {
    kind: "package",
    flagUri: "",
    dataLabel: "1 GB",
    durationLabel: "7 days",
    title: "1 GB - 7 days",
    price: "€5.00",
    priceNumeric: 5,
    dataNumericGb: 1,
    durationDays: 7,
    filters: ["local"],
    query: "",
    ...overrides,
  };
}

const ASIA = {
  country: "Asia",
  countryCode: "asia",
  filters: ["regional"],
  countries: [{ countryCode: "JP", title: "Japan" }],
};

describe("toCountryOptions", () => {
  it("merges local plans and regional coverage into one option per destination, sorted by name", () => {
    const options = toCountryOptions([
      plan({ id: "jp-1", country: "Japan", countryCode: "japan", flagUri: "https://flagcdn.com/w80/jp.png" }),
      plan({ id: "asia-1", ...ASIA }),
    ]);

    expect(options.map((option) => [option.country, option.countryCode, option.planCount])).toEqual([
      ["Asia", "asia", 1],
      ["Japan", "japan", 2],
    ]);
    expect(options[1].flagUri).toBe("https://flagcdn.com/w80/jp.png");
  });

  it("shows the cheapest plan as the from-price, including covering regional bundles", () => {
    const localOnly = toCountryOptions([
      plan({ id: "jp-big", country: "Japan", countryCode: "japan", price: "€12.00", priceNumeric: 12 }),
      plan({ id: "jp-small", country: "Japan", countryCode: "japan", price: "€4.50", priceNumeric: 4.5 }),
    ]);
    expect(localOnly[0].fromPrice).toBe("€4.50");

    const withRegional = toCountryOptions([
      plan({ id: "jp-small", country: "Japan", countryCode: "japan", price: "€4.50", priceNumeric: 4.5 }),
      plan({ id: "asia-1", ...ASIA, price: "€3.00", priceNumeric: 3 }),
    ]);
    expect(withRegional.find((option) => option.countryCode === "japan")?.fromPrice).toBe("€3.00");
    expect(withRegional.find((option) => option.countryCode === "asia")?.fromPrice).toBe("€3.00");
  });

  it("ignores unparseable prices unless a destination has nothing else", () => {
    const options = toCountryOptions([
      plan({ id: "it-1", country: "Italy", countryCode: "italy", price: "View plan", priceNumeric: 0 }),
      plan({ id: "it-2", country: "Italy", countryCode: "italy", price: "€6.00", priceNumeric: 6 }),
      plan({ id: "es-1", country: "Spain", countryCode: "spain", price: "View plan", priceNumeric: 0 }),
    ]);

    expect(options.map((option) => option.fromPrice)).toEqual(["€6.00", "View plan"]);
  });

  it("is the only copy: DestinationBrowse imports it", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain('import { toCountryOptions } from "./browseCountries";');
    expect(source).not.toContain("function toCountryOptions");
    expect(source).not.toContain("function normalizeCountryCode");
  });
});
