import { describe, expect, it } from "vitest";
import { destinationPages } from "@/content/seo-pages";
import {
  backendCountryCode,
  destinationBrowseHref,
  destinationDisplay,
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
    expect(destinationH1("ireland")).toBe("eSIM for Ireland");
    expect(destinationH1("croatia")).toBe("eSIM for Croatia");
  });

  it("has display data for every /esim destination page", () => {
    const missing = destinationPages.filter((page) => !(page.slug in destinationDisplay));
    expect(missing.map((page) => page.slug)).toEqual([]);
  });

  it("maps regional slugs onto the backend region codes that carry packages", () => {
    expect(backendCountryCode("balkans")).toBe("europe");
    expect(backendCountryCode("middle-east")).toBe("middle-east-and-north-africa");
    expect(backendCountryCode("south-america")).toBe("latin-america");
    expect(backendCountryCode("japan")).toBe("japan");
  });
});
