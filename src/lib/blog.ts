import { createHmac, timingSafeEqual } from "node:crypto";
import { backendFetch } from "@/lib/backend";

/**
 * Holo (tryholo.ai) blog posts. Holo POSTs articles to the backend's
 * /api/holo-webhook (nginx sends /api to Express); the backend stores them and
 * pings /bff/blog/revalidate. These pages read them back from /api/blog.
 */

/** Fallback when a revalidate ping is lost: pages refetch at most this stale. */
export const BLOG_REVALIDATE_SECONDS = 3600;

/** Cache tag on every blog fetch; /bff/blog/revalidate expires it on publish. */
export const BLOG_CACHE_TAG = "blog";

/** /blog shows this many posts per page; ?page=N for the rest. */
export const BLOG_PAGE_SIZE = 12;

/**
 * Near-duplicate posts Holo published under two slugs. Both stay live; the
 * older one (by publishedAt) points its canonical at the newest, and only the
 * newest is listed in the sitemap and related-post blocks.
 */
const DUPLICATE_POST_GROUPS: readonly (readonly string[])[] = [
  ["esim-vs-roaming-which-keeps-your-mobile-bill-lower", "esim-vs-roaming-which-keeps-your-bill-lower"]
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImage: string | null;
  publishedAt: string;
  updatedAt: string;
};

export type BlogPost = BlogPostSummary & {
  /** Sanitized by the backend on ingest. */
  contentHtml: string;
  images: { url: string; alt: string }[];
};

export function isValidBlogSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 200 && SLUG_PATTERN.test(value);
}

export function blogPath(slug: string): string {
  return `/blog/${slug}`;
}

/** The index paginates locally and the sitemap lists everything, so both ask for all. */
const ALL_POSTS_LIMIT = 5000;

/** Empty on any backend failure, so a build or the sitemap never breaks on it. */
export async function loadBlogPosts({ all = false }: { all?: boolean } = {}): Promise<BlogPostSummary[]> {
  const result = await backendFetch<{ posts?: BlogPostSummary[] }>(all ? `/blog?limit=${ALL_POSTS_LIMIT}` : "/blog", {
    next: { revalidate: BLOG_REVALIDATE_SECONDS, tags: [BLOG_CACHE_TAG] }
  });
  if (!result.ok || !Array.isArray(result.data.posts)) return [];
  return sortNewestFirst(result.data.posts.filter((post) => isValidBlogSlug(post.slug)));
}

function publishedTime(post: Pick<BlogPostSummary, "publishedAt">): number {
  const time = Date.parse(post.publishedAt);
  return Number.isNaN(time) ? 0 : time;
}

export function sortNewestFirst<T extends Pick<BlogPostSummary, "publishedAt">>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => publishedTime(b) - publishedTime(a));
}

/** Page `page` (1-based, clamped) of the newest-first list. */
export function paginateBlogPosts<T>(posts: readonly T[], page: number) {
  const pageCount = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * BLOG_PAGE_SIZE;
  return { posts: posts.slice(start, start + BLOG_PAGE_SIZE), page: current, pageCount };
}

export function blogIndexPath(page: number): string {
  return page > 1 ? `/blog?page=${page}` : "/blog";
}

/**
 * The slug a post's canonical should name: itself, or for an older member of
 * a duplicate group, the group's newest live post.
 */
export function canonicalBlogSlug(slug: string, posts: readonly BlogPostSummary[]): string {
  const group = DUPLICATE_POST_GROUPS.find((slugs) => slugs.includes(slug));
  if (!group) return slug;
  const newest = sortNewestFirst(posts.filter((post) => group.includes(post.slug)))[0];
  return newest?.slug ?? slug;
}

/** Posts whose canonical is another post: kept live, left out of the sitemap and related links. */
export function isDuplicateBlogPost(slug: string, posts: readonly BlogPostSummary[]): boolean {
  return canonicalBlogSlug(slug, posts) !== slug;
}

const STOP_WORDS = new Set(
  "a an and are as at be best by can do for from how in is it of on or the to vs what which with you your esim esims".split(" ")
);

function topicWords(post: Pick<BlogPostSummary, "title" | "excerpt">): Set<string> {
  return new Set(
    `${post.title} ${post.excerpt}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );
}

/**
 * `count` other posts for the internal-link block under a post: most shared
 * title/excerpt words first, newest first on ties, never a duplicate of it.
 * An older duplicate leads with its canonical twin, so its visitors reach it.
 */
export function relatedBlogPosts(
  post: Pick<BlogPostSummary, "slug" | "title" | "excerpt">,
  posts: readonly BlogPostSummary[],
  count = 3
): BlogPostSummary[] {
  const words = topicWords(post);
  const self = canonicalBlogSlug(post.slug, posts);
  const twin = self !== post.slug ? posts.find((other) => other.slug === self) : undefined;
  const ranked = sortNewestFirst(posts)
    .filter((other) => other.slug !== post.slug && canonicalBlogSlug(other.slug, posts) !== self)
    .filter((other) => !isDuplicateBlogPost(other.slug, posts))
    .map((other, index) => ({
      other,
      index,
      score: [...topicWords(other)].filter((word) => words.has(word)).length
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ other }) => other);
  return (twin ? [twin, ...ranked] : ranked).slice(0, count);
}

/**
 * null only when the backend says 404. Other failures throw, so ISR keeps
 * serving the last good copy instead of caching a not-found page.
 */
export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  if (!isValidBlogSlug(slug)) return null;
  const result = await backendFetch<{ post?: BlogPost }>(`/blog/${slug}`, {
    next: { revalidate: BLOG_REVALIDATE_SECONDS, tags: [BLOG_CACHE_TAG] }
  });
  if (!result.ok) {
    if (result.status === 404) return null;
    throw new Error(`Blog post ${slug} failed to load (${result.status})`);
  }
  return result.data.post ?? null;
}

/** Same scheme Holo uses: 'sha256=' + hex HMAC-SHA256 of the raw body. */
export function verifyHoloSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`);
  const received = Buffer.from(header.trim());
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}
