import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  vi.useRealTimers();
});

describe("server package catalog", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reuses a successful catalog response for 60 seconds", async () => {
    const fetchMock = vi.fn(async () => packagesResponse([apiPackage]));
    vi.stubGlobal("fetch", fetchMock);
    const { getPackageOptions } = await import("./server-packages");

    await getPackageOptions();
    await getPackageOptions();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent catalog requests", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = vi.fn(() => response);
    vi.stubGlobal("fetch", fetchMock);
    const { getPackageOptions } = await import("./server-packages");

    const first = getPackageOptions();
    const second = getPackageOptions();
    resolveResponse?.(packagesResponse([apiPackage]));

    await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fetches again after the 60-second cache window", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => packagesResponse([apiPackage]));
    vi.stubGlobal("fetch", fetchMock);
    const { getPackageOptions } = await import("./server-packages");

    await getPackageOptions();
    vi.advanceTimersByTime(60_000);
    await getPackageOptions();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache an unsuccessful catalog response", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error("ECONNREFUSED");
      })
      .mockImplementationOnce(async () => packagesResponse([apiPackage]));
    vi.stubGlobal("fetch", fetchMock);
    const { getPackageOptions } = await import("./server-packages");

    expect(await getPackageOptions()).toEqual([]);
    expect(await getPackageOptions()).toHaveLength(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("serves the last successful catalog while a refresh is unavailable", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => packagesResponse([apiPackage]))
      .mockImplementationOnce(async () => {
        throw new Error("ECONNREFUSED");
      });
    vi.stubGlobal("fetch", fetchMock);
    const { getPackageOptions } = await import("./server-packages");

    const initial = await getPackageOptions();
    vi.advanceTimersByTime(60_000);
    const stale = await getPackageOptions();

    expect(initial).toHaveLength(1);
    expect(stale).toEqual(initial);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const refreshed = await getPackageOptions();
    expect(refreshed).toEqual(initial);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("resolves an individual option from the shared catalog result", async () => {
    const fetchMock = vi.fn(async () => packagesResponse([apiPackage]));
    vi.stubGlobal("fetch", fetchMock);
    const { getPackageOption, getPackageOptions } = await import("./server-packages");

    await getPackageOptions();
    const option = await getPackageOption("hej-telecom-in-30days-20gb");

    expect(option?.id).toBe("hej-telecom-in-30days-20gb");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the matching plan for a catalog id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => packagesResponse([apiPackage])));
    const { getPackageOption } = await import("./server-packages");

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
    const { getPackageOption } = await import("./server-packages");

    expect(await getPackageOption("does-not-exist")).toBeNull();
  });

  it("returns null rather than throwing when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );
    const { getPackageOption } = await import("./server-packages");

    expect(await getPackageOption("hej-telecom-in-30days-20gb")).toBeNull();
  });

  it("ignores a blank id without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { getPackageOption } = await import("./server-packages");

    expect(await getPackageOption("")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
