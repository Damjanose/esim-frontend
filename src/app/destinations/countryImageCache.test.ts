import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  countryImageKey,
  countryImageUrl,
  createCountryImageCache,
  isOptimizableImageUrl,
} from "./countryImageCache";

const JAPAN = { slug: "japan", country: "Japan" };
const PHOTO = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Shinjuku.jpg/1920px-Shinjuku.jpg";

function fetcherReturning(response: { ok: boolean; body?: unknown }) {
  return vi.fn(async (_input: string, _init?: RequestInit) => ({
    ok: response.ok,
    json: async () => response.body,
  }));
}

describe("countryImageCache", () => {
  it("builds the same BFF URL DestinationPlans uses (slug first, then country)", () => {
    expect(countryImageUrl(JAPAN)).toBe("/bff/country-image?slug=japan&country=Japan");
    expect(countryImageUrl({ slug: "", country: "Côte d'Ivoire" })).toBe(
      "/bff/country-image?country=C%C3%B4te+d%27Ivoire",
    );
  });

  it("keys by slug, falling back to the slugified country name", () => {
    expect(countryImageKey({ slug: " Japan ", country: "Ignored" })).toBe("japan");
    expect(countryImageKey({ slug: "", country: "Côte d'Ivoire" })).toBe("cote-d-ivoire");
    expect(countryImageKey({ slug: "", country: "  " })).toBe("");
  });

  it("fetches each country once, however many tiles ask for it", async () => {
    const fetcher = fetcherReturning({ ok: true, body: { imageUrl: PHOTO, alt: "Shinjuku" } });
    const cache = createCountryImageCache(fetcher);

    const [first, second] = await Promise.all([
      cache.load(JAPAN),
      cache.load({ slug: "JAPAN ", country: "Japan" }),
    ]);
    const later = await cache.load(JAPAN);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("/bff/country-image?slug=japan&country=Japan", {
      cache: "force-cache",
    });
    expect(first).toEqual({ imageUrl: PHOTO });
    expect(second).toBe(first);
    expect(later).toBe(first);
  });

  it("peek is undefined until the request settles, then returns the cached result", async () => {
    const cache = createCountryImageCache(fetcherReturning({ ok: true, body: { imageUrl: PHOTO } }));

    expect(cache.peek(JAPAN)).toBeUndefined();
    const pending = cache.load(JAPAN);
    expect(cache.peek(JAPAN)).toBeUndefined();
    await pending;

    expect(cache.peek(JAPAN)).toEqual({ imageUrl: PHOTO });
    expect(cache.peek({ slug: "italy", country: "Italy" })).toBeUndefined();
  });

  it("caches a definitive miss (non-2xx or no imageUrl) as null without refetching", async () => {
    const notFound = fetcherReturning({ ok: false, body: { message: "Could not resolve media" } });
    const missCache = createCountryImageCache(notFound);
    expect(await missCache.load(JAPAN)).toBeNull();
    expect(await missCache.load(JAPAN)).toBeNull();
    expect(missCache.peek(JAPAN)).toBeNull();
    expect(notFound).toHaveBeenCalledTimes(1);

    const noUrl = fetcherReturning({ ok: true, body: { imageUrl: "" } });
    expect(await createCountryImageCache(noUrl).load(JAPAN)).toBeNull();

    const emptyKey = fetcherReturning({ ok: true, body: { imageUrl: PHOTO } });
    expect(await createCountryImageCache(emptyKey).load({ slug: "", country: " " })).toBeNull();
    expect(emptyKey).not.toHaveBeenCalled();
  });

  it("turns a network error into null and evicts it, so a later tile can retry", async () => {
    let offline = true;
    const fetcher = vi.fn(async (_input: string, _init?: RequestInit) => {
      if (offline) throw new TypeError("Failed to fetch");
      return { ok: true, json: async () => ({ imageUrl: PHOTO }) };
    });
    const cache = createCountryImageCache(fetcher);

    expect(await cache.load(JAPAN)).toBeNull();
    expect(cache.peek(JAPAN)).toBeUndefined();

    offline = false;
    expect(await cache.load(JAPAN)).toEqual({ imageUrl: PHOTO });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("only hands next/image the hosts next.config.mjs allows", () => {
    expect(isOptimizableImageUrl(PHOTO)).toBe(true);
    expect(isOptimizableImageUrl("https://thumb.wikimedia.org/x.jpg")).toBe(true);
    expect(isOptimizableImageUrl("https://images.unsplash.com/photo-1")).toBe(true);
    expect(isOptimizableImageUrl("https://flagcdn.com/w80/jp.png")).toBe(true);

    expect(isOptimizableImageUrl("http://upload.wikimedia.org/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("https://a.b.wikimedia.org/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("https://wikimedia.org.example.com/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("https://example.com/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("not a url")).toBe(false);
  });

  it("stays in sync with next.config.mjs remotePatterns", () => {
    const config = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");

    expect(config).toContain('hostname: "images.unsplash.com"');
    expect(config).toContain('hostname: "*.wikimedia.org"');
    expect(config).toContain('hostname: "flagcdn.com"');
  });
});
