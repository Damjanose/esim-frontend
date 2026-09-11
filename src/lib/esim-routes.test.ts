import { describe, expect, it } from "vitest";
import {
  destinationBrowseHref,
  destinationH1,
  esimPathForCountryQuery,
  esimSlugFromCountryQuery
} from "./esim-routes";

describe("esim URL mapping", () => {
  it("maps backend country codes and aliases onto /esim slugs", () => {
    expect(esimSlugFromCountryQuery("united-states")).toBe("usa");
    expect(esimSlugFromCountryQuery("usa")).toBe("usa");
    expect(esimSlugFromCountryQuery("albania")).toBe("albania");
    expect(esimPathForCountryQuery("japan")).toBe("/esim/japan");
    expect(esimPathForCountryQuery("hungary")).toBeNull();
  });

  it("uses canonical destination pages for browse links when they exist", () => {
    expect(destinationBrowseHref("united-states")).toBe("/esim/usa");
    expect(destinationBrowseHref("hungary")).toBe("/destinations?country=hungary");
  });

  it("builds keyword H1s for destination pages", () => {
    expect(destinationH1("albania")).toBe("eSIM for Albania");
    expect(destinationH1("usa")).toBe("eSIM for USA");
  });
});
