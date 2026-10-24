import { createHmac, timingSafeEqual } from "node:crypto";
import { backendFetch } from "@/lib/backend";

/**
 * Holo (tryholo.ai) blog posts. Holo POSTs articles to the backend's
 * /api/holo-webhook (nginx sends /api to Express); the backend stores them and
 * pings /bff/blog/revalidate. These pages read them back from /api/blog.
 */

/** Fallback when a revalidate ping is lost: pages refetch at most this stale. */
export const BLOG_REVALIDATE_SECONDS = 3600;

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

/** The index page shows the newest page of posts; the sitemap asks for all. */
const ALL_POSTS_LIMIT = 5000;

/** Empty on any backend failure, so a build or the sitemap never breaks on it. */
export async function loadBlogPosts({ all = false }: { all?: boolean } = {}): Promise<BlogPostSummary[]> {
  const result = await backendFetch<{ posts?: BlogPostSummary[] }>(all ? `/blog?limit=${ALL_POSTS_LIMIT}` : "/blog", {
    next: { revalidate: BLOG_REVALIDATE_SECONDS }
  });
  if (!result.ok || !Array.isArray(result.data.posts)) return [];
  return result.data.posts.filter((post) => isValidBlogSlug(post.slug));
}

/**
 * null only when the backend says 404. Other failures throw, so ISR keeps
 * serving the last good copy instead of caching a not-found page.
 */
export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  if (!isValidBlogSlug(slug)) return null;
  const result = await backendFetch<{ post?: BlogPost }>(`/blog/${slug}`, {
    next: { revalidate: BLOG_REVALIDATE_SECONDS }
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
