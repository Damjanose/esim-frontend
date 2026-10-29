import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { BLOG_CACHE_TAG, blogPath, isValidBlogSlug, verifyHoloSignature } from "@/lib/blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called by the backend after it stores a Holo article (POST /api/holo-webhook),
 * signed with the same HOLO_WEBHOOK_SECRET. Body: { slugs: string[] }.
 */
export async function POST(request: Request) {
  const secret = process.env.HOLO_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyHoloSignature(rawBody, request.headers.get("x-holo-signature"), secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let slugs: string[];
  try {
    const parsed = JSON.parse(rawBody) as { slugs?: unknown };
    slugs = Array.isArray(parsed.slugs) ? parsed.slugs.filter(isValidBlogSlug).slice(0, 10) : [];
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // The tag covers every cached blog fetch: the index pages, each post's
  // related-posts block and both sitemaps. The paths below drop the rendered pages.
  revalidateTag(BLOG_CACHE_TAG);
  revalidatePath("/blog");
  for (const slug of slugs) revalidatePath(blogPath(slug));
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemaps/blog.xml");

  return NextResponse.json({ ok: true, revalidated: slugs.map(blogPath) });
}
