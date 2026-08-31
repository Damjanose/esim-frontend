import { describe, expect, it } from "vitest";
import { mapPackageGroupsPayload } from "./packages";

const apiPackage = {
  kind: "standard",
  id: "united-states-30days-unlimited",
  country: "United States",
  countryCode: "united-states",
  flagUri: "https://cdn.example.com/us.png",
  dataLabel: "Unlimited",
  durationLabel: "30 Days Duration",
  title: "Unlimited - 30 days",
  price: "€9.00",
  priceNumeric: 9,
  dataNumericGb: 999,
  durationDays: 30,
  filters: ["local"]
};

describe("mapPackageGroupsPayload", () => {
  it("maps each rail's raw packages through the same mapping fetchPackageOptions uses", () => {
    const groups = mapPackageGroupsPayload({
      status: "success",
      data: {
        popular: [apiPackage],
        bestValue: [],
        unlimited: [apiPackage],
        longStay: [apiPackage]
      }
    });

    expect(groups.popular).toHaveLength(1);
    expect(groups.popular[0]).toMatchObject({
      id: "united-states-30days-unlimited",
      country: "United States",
      price: "€9.00"
    });
    expect(groups.bestValue).toEqual([]);
    expect(groups.unlimited).toHaveLength(1);
    expect(groups.longStay).toHaveLength(1);
  });

  it("defaults every rail to an empty array when the backend omits one", () => {
    const groups = mapPackageGroupsPayload({ status: "success", data: {} });

    expect(groups).toEqual({
      popular: [],
      bestValue: [],
      unlimited: [],
      longStay: []
    });
  });

  it("accepts a bare rail record without the status/data envelope", () => {
    const groups = mapPackageGroupsPayload({ popular: [apiPackage] });

    expect(groups.popular).toHaveLength(1);
  });
});
