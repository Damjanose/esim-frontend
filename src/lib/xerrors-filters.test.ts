import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  filtersFromSearchParams,
  filtersToBackendParams,
  filtersToUrlParams,
  hasActiveFilters
} from "./xerrors-filters";

describe("xerrors filters", () => {
  it("defaults to unresolved, newest first, 25 per page", () => {
    const filters = filtersFromSearchParams(new URLSearchParams());
    expect(filters).toEqual(DEFAULT_FILTERS);
    expect(filters.resolved).toBe("false");
    expect(filters.limit).toBe("25");
    expect(filters.sort).toBe("newest");
  });

  it("keeps the shareable URL empty for the default view", () => {
    expect(filtersToUrlParams(DEFAULT_FILTERS).toString()).toBe("");
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it("round-trips filters through the URL", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      q: "pay_123",
      kind: "client_error",
      source: "client-mobile",
      platform: "ios",
      appVersion: "1.4.2",
      hasEmail: "false",
      noEmailReason: "token_expired",
      statusClass: "5xx",
      from: "2026-10-01",
      resolved: "all",
      sort: "oldest",
      limit: "100"
    };
    const params = filtersToUrlParams(filters);
    expect(filtersFromSearchParams(new URLSearchParams(params.toString()))).toEqual(filters);
    expect(hasActiveFilters(filters)).toBe(true);
  });

  it("ignores unknown values and trims text", () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams("kind=bogus&limit=7&sort=sideways&platform=ios&q=%20%20abc%20")
    );
    expect(filters.kind).toBe("");
    expect(filters.limit).toBe("25");
    expect(filters.sort).toBe("newest");
    expect(filters.platform).toBe("ios");
    expect(filters.q).toBe("abc");
  });

  it("builds backend params with cursor, resolved mapping and no empty values", () => {
    const params = filtersToBackendParams({ ...DEFAULT_FILTERS, q: "x", kind: "crash" }, "cur1");
    expect(params.get("q")).toBe("x");
    expect(params.get("kind")).toBe("crash");
    expect(params.get("resolved")).toBe("false");
    expect(params.get("limit")).toBe("25");
    expect(params.get("sort")).toBe("newest");
    expect(params.get("cursor")).toBe("cur1");
    expect(params.has("area")).toBe(false);
  });

  it("omits resolved for 'all' and omits the cursor on the first page", () => {
    const params = filtersToBackendParams({ ...DEFAULT_FILTERS, resolved: "all" });
    expect(params.has("resolved")).toBe(false);
    expect(params.has("cursor")).toBe(false);
  });

  it("builds stats params without paging or sorting", () => {
    const params = filtersToBackendParams({ ...DEFAULT_FILTERS, kind: "crash" }, undefined, { forStats: true });
    expect(params.has("limit")).toBe(false);
    expect(params.has("sort")).toBe(false);
    expect(params.has("cursor")).toBe(false);
    expect(params.get("kind")).toBe("crash");
  });

  it("keeps the backend's real-failures default for the plain view", () => {
    const params = filtersToBackendParams(DEFAULT_FILTERS);
    expect(params.has("realFailuresOnly")).toBe(false);
  });

  it("sends realFailuresOnly=false whenever a narrowing filter is set, on list and stats", () => {
    for (const patch of [
      { statusCode: "401" },
      { statusClass: "4xx" },
      { severity: "info" },
      { noEmailReason: "token_expired" },
      { area: "auth" },
      { kind: "http_error" },
      { source: "server" },
      { appVersion: "1" },
      { platform: "ios" },
      { scenario: "x" },
      { q: "x" },
      { ip: "1.2.3.4" },
      { hasEmail: "false" }
    ]) {
      const filters = { ...DEFAULT_FILTERS, ...patch };
      expect(filtersToBackendParams(filters).get("realFailuresOnly")).toBe("false");
      expect(filtersToBackendParams(filters, undefined, { forStats: true }).get("realFailuresOnly")).toBe("false");
    }
  });

  it("has an explicit include-minor toggle kept in the URL", () => {
    const filters = { ...DEFAULT_FILTERS, includeMinor: "true" };
    expect(filtersToBackendParams(filters).get("realFailuresOnly")).toBe("false");
    expect(filtersToUrlParams(filters).get("includeMinor")).toBe("true");
    expect(filtersFromSearchParams(new URLSearchParams("includeMinor=true")).includeMinor).toBe("true");
    expect(hasActiveFilters(filters)).toBe(true);
  });

  it("accepts the same severities, areas, kinds, sources and platforms as the backend", () => {
    const parsed = filtersFromSearchParams(
      new URLSearchParams("severity=info&area=airalo&kind=parse_error&source=client-web&platform=unknown")
    );
    expect(parsed).toMatchObject({ severity: "info", area: "airalo", kind: "parse_error", source: "client-web", platform: "unknown" });
    expect(filtersFromSearchParams(new URLSearchParams("area=esim")).area).toBe("esim");
  });
});
