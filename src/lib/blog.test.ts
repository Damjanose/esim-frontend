import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidBlogSlug, verifyHoloSignature } from "@/lib/blog";
import { blogSitemapEntries } from "@/lib/sitemaps";

describe("verifyHoloSignature", () => {
  const body = '{"slugs":["a"]}';
  const sig = `sha256=${createHmac("sha256", "s").update(body).digest("hex")}`;

  it("matches the backend's sha256=<hex> scheme", () => {
    expect(verifyHoloSignature(body, sig, "s")).toBe(true);
    expect(verifyHoloSignature(body, sig, "t")).toBe(false);
    expect(verifyHoloSignature(body, null, "s")).toBe(false);
    expect(verifyHoloSignature(body, sig, "")).toBe(false);
  });
});

describe("isValidBlogSlug", () => {
  it("only allows kebab-case path segments", () => {
    expect(isValidBlogSlug("best-esim-italy")).toBe(true);
    expect(isValidBlogSlug("../x")).toBe(false);
    expect(isValidBlogSlug("A")).toBe(false);
  });
});

describe("blogSitemapEntries", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists /blog and every post, dated by its last update", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          status: "success",
          data: {
            posts: [
              { slug: "newer", title: "N", excerpt: "", publishedAt: "2026-10-20T00:00:00.000Z", updatedAt: "2026-10-23T00:00:00.000Z" },
              { slug: "older", title: "O", excerpt: "", publishedAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z" }
            ]
          }
        })
      )
    );
    const entries = await blogSitemapEntries();
    expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual(["/blog", "/blog/newer", "/blog/older"]);
    expect(entries[0]!.lastModified).toEqual(new Date("2026-10-23T00:00:00.000Z"));
  });

  it("is empty when the backend is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await blogSitemapEntries()).toEqual([]);
  });
});
