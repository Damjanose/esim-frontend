import { afterEach, describe, expect, it, vi } from "vitest";
import { getPackageOption } from "./server-packages";

const apiPackage = {
  kind: "standard",
  id: "hej-telecom-in-30days-20gb",
  country: "India",
  countryCode: "india",
  flagUri: "https://cdn.example.com/in.png",
  dataLabel: "20 GB",
  durationLabel: "30 Days Duration",
  title: "20 GB - 30 days",
  price: "€24.50",
  priceNumeric: 24.5,
  dataNumericGb: 20,
  durationDays: 30,
  filters: ["local"]
};

function packagesResponse(packages: unknown[]) {
  return new Response(JSON.stringify({ status: "success", data: { packages } }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getPackageOption", () => {
  it("returns the matching plan for a catalog id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => packagesResponse([apiPackage])));

    const option = await getPackageOption("hej-telecom-in-30days-20gb");

    expect(option).toMatchObject({
      id: "hej-telecom-in-30days-20gb",
      country: "India",
      dataLabel: "20 GB",
      price: "€24.50",
      durationDays: 30
    });
  });

  it("returns null for an id that is not in the catalog", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => packagesResponse([apiPackage])));

    expect(await getPackageOption("does-not-exist")).toBeNull();
  });

  it("returns null rather than throwing when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );

    expect(await getPackageOption("hej-telecom-in-30days-20gb")).toBeNull();
  });

  it("ignores a blank id without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await getPackageOption("")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
