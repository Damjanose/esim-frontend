import { describe, expect, it } from "vitest";
import { normalizeHost, resolveSiteHosts } from "./site-host";

describe("resolveSiteHosts", () => {
  it("defaults to esim.uplisoft.com and folds www and the brand domain into it", () => {
    const { canonicalHost, aliasHosts } = resolveSiteHosts({});

    expect(canonicalHost).toBe("esim.uplisoft.com");
    expect(aliasHosts).toEqual([
      "esim2you.com",
      "www.esim.uplisoft.com",
      "www.esim2you.com"
    ]);
  });

  it("makes the old host an alias after a move to a brand domain", () => {
    const { canonicalHost, aliasHosts } = resolveSiteHosts({ siteHost: "esim2you.com" });

    expect(canonicalHost).toBe("esim2you.com");
    expect(aliasHosts).toContain("esim.uplisoft.com");
    expect(aliasHosts).toContain("www.esim.uplisoft.com");
    expect(aliasHosts).toContain("www.esim2you.com");
    expect(aliasHosts).not.toContain("esim2you.com");
  });

  it("adds configured aliases and ignores junk entries", () => {
    const { aliasHosts } = resolveSiteHosts({
      aliasHosts: " https://ESIM2YOU.app/ , not a host, ,"
    });

    expect(aliasHosts).toContain("esim2you.app");
    expect(aliasHosts).toContain("www.esim2you.app");
    expect(aliasHosts).not.toContain("not a host");
  });

  it("falls back to the default host when the configured one is invalid", () => {
    expect(resolveSiteHosts({ siteHost: "localhost" }).canonicalHost).toBe("esim.uplisoft.com");
  });
});

describe("normalizeHost", () => {
  it("strips scheme, port, path and a trailing dot", () => {
    expect(normalizeHost("https://Esim2You.com:443/path")).toBe("esim2you.com");
    expect(normalizeHost("esim2you.com.")).toBe("esim2you.com");
    expect(normalizeHost(undefined)).toBeNull();
  });
});
