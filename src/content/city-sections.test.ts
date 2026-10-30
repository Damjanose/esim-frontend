import { describe, expect, it } from "vitest";
import { citySections, citySectionsFor, cityTitleOverrides, fillCityTokens } from "./city-sections";

describe("fillCityTokens", () => {
  it("fills the live from-price in euros", () => {
    expect(fillCityTokens("plans start at {fromPrice}.", 3.5)).toBe("plans start at €3.50.");
    expect(fillCityTokens(cityTitleOverrides.spain, 2)).toBe("Spain eSIM for Barcelona & Madrid | from €2.00 | eSIM2you");
  });

  it("drops the price clause without a live offer", () => {
    expect(fillCityTokens(cityTitleOverrides.italy, null)).toBe("Italy eSIM for Rome & Milan | eSIM2you");
    expect(fillCityTokens("Spain plans start at {fromPrice} and work across the city.", null)).toBe(
      "Spain plans work across the city."
    );
    expect(fillCityTokens("Italy plans start at {fromPrice} on 4G/5G.", undefined)).toBe(
      "Italy plans are available on 4G/5G."
    );
  });

  it("never leaves a placeholder in any section or title", () => {
    for (const fromPrice of [4, null]) {
      for (const slug of Object.keys(citySections)) {
        for (const section of citySectionsFor(slug, fromPrice)) {
          expect(section.body.join(" ")).not.toContain("{");
        }
        expect(fillCityTokens(cityTitleOverrides[slug], fromPrice)).not.toContain("{");
      }
    }
  });
});

describe("citySections", () => {
  it("has unique anchors and city-led titles within 65 characters", () => {
    const ids = Object.values(citySections).flat().map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const title of Object.values(cityTitleOverrides)) {
      expect(fillCityTokens(title, 99.99).length).toBeLessThanOrEqual(65);
    }
  });

  it("spells the brand eSIM2you", () => {
    expect(JSON.stringify(citySections)).not.toMatch(/esim2you|Esim2you|ESIM2YOU/);
  });
});
