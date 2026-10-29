import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BLOG_PAGE_SIZE,
  canonicalBlogSlug,
  isValidBlogSlug,
  paginateBlogPosts,
  relatedBlogPosts,
  sortNewestFirst,
  verifyHoloSignature,
  type BlogPostSummary
} from "@/lib/blog";
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

function summary(slug: string, publishedAt: string, title = slug.replace(/-/g, " ")): BlogPostSummary {
  return {
    slug,
    title,
    excerpt: "",
    metaTitle: null,
    metaDescription: null,
    featuredImage: null,
    publishedAt,
    updatedAt: publishedAt
  };
}

describe("blog index ordering and pagination", () => {
  it("sorts newest first and pages by BLOG_PAGE_SIZE", () => {
    const posts = Array.from({ length: BLOG_PAGE_SIZE + 2 }, (_, i) =>
      summary(`post-${i}`, new Date(Date.UTC(2026, 0, i + 1)).toISOString())
    );
    const sorted = sortNewestFirst(posts);
    expect(sorted[0]!.slug).toBe(`post-${BLOG_PAGE_SIZE + 1}`);

    const first = paginateBlogPosts(sorted, 1);
    expect(first.posts).toHaveLength(BLOG_PAGE_SIZE);
    expect(first.pageCount).toBe(2);
    expect(paginateBlogPosts(sorted, 2).posts.map((p) => p.slug)).toEqual(["post-1", "post-0"]);
    // Out of range clamps, which the page turns into a 404.
    expect(paginateBlogPosts(sorted, 9).page).toBe(2);
    expect(paginateBlogPosts([], 1)).toEqual({ posts: [], page: 1, pageCount: 1 });
  });
});

describe("duplicate eSIM vs roaming posts", () => {
  const older = summary("esim-vs-roaming-which-keeps-your-mobile-bill-lower", "2026-10-01T00:00:00.000Z");
  const newer = summary("esim-vs-roaming-which-keeps-your-bill-lower", "2026-10-05T00:00:00.000Z");

  it("points the older post's canonical at the newer one, whichever slug is older", () => {
    expect(canonicalBlogSlug(older.slug, [older, newer])).toBe(newer.slug);
    expect(canonicalBlogSlug(newer.slug, [older, newer])).toBe(newer.slug);

    const flipped = [
      { ...older, publishedAt: "2026-10-09T00:00:00.000Z" },
      newer
    ];
    expect(canonicalBlogSlug(newer.slug, flipped)).toBe(older.slug);
  });

  it("keeps its own canonical when the twin isn't live", () => {
    expect(canonicalBlogSlug(older.slug, [older])).toBe(older.slug);
    expect(canonicalBlogSlug("unrelated-post", [older, newer])).toBe("unrelated-post");
  });

  it("leaves the older twin out of the sitemap", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ status: "success", data: { posts: [older, newer] } }))
    );
    const entries = await blogSitemapEntries();
    expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual(["/blog", `/blog/${newer.slug}`]);
    vi.unstubAllGlobals();
  });
});

describe("relatedBlogPosts", () => {
  const posts = [
    summary("best-esim-for-japan", "2026-10-10T00:00:00.000Z", "Best eSIM for Japan"),
    summary("japan-mobile-data-guide", "2026-10-01T00:00:00.000Z", "Japan mobile data guide"),
    summary("esim-vs-roaming-which-keeps-your-mobile-bill-lower", "2026-09-01T00:00:00.000Z", "eSIM vs roaming bill"),
    summary("esim-vs-roaming-which-keeps-your-bill-lower", "2026-09-05T00:00:00.000Z", "eSIM vs roaming bill"),
    summary("italy-esim-guide", "2026-10-12T00:00:00.000Z", "Italy eSIM guide"),
    summary("travel-packing-list", "2026-10-15T00:00:00.000Z", "Travel packing list")
  ];

  it("returns three others, topic matches first, never itself or a duplicate", () => {
    const related = relatedBlogPosts(posts[0]!, posts).map((post) => post.slug);
    expect(related).toHaveLength(3);
    expect(related[0]).toBe("japan-mobile-data-guide");
    expect(related).not.toContain("best-esim-for-japan");
    expect(related).not.toContain("esim-vs-roaming-which-keeps-your-mobile-bill-lower");
  });

  it("never links a duplicate to its own twin", () => {
    const related = relatedBlogPosts(posts[2]!, posts).map((post) => post.slug);
    expect(related).not.toContain("esim-vs-roaming-which-keeps-your-bill-lower");
    expect(related).not.toContain("esim-vs-roaming-which-keeps-your-mobile-bill-lower");
  });
});
