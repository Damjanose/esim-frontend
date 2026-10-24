import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "../../JsonLd";
import { Navbar } from "../../components/Navbar";
import { CONTENT_EYEBROW, CONTENT_GUTTER, CONTENT_H1, CONTENT_TEXT_LINK, CONTENT_TOP } from "../../components/contentClasses";
import { SiteFooter } from "../../SiteFooter";
import { blogPath, formatBlogDate, loadBlogPost } from "@/lib/blog";
import { absoluteUrl, createMetadata, ogImage, siteName, siteUrl } from "@/lib/seo";

// Must be a literal for Next; keep it equal to BLOG_REVALIDATE_SECONDS.
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

// Nothing prerendered at build: posts render on first request and ISR caches them,
// so a backend hiccup on one post can't fail `next build`.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await loadBlogPost((await params).slug);
  if (!post) return { title: "Post not found", robots: { index: false, follow: false } };

  const base = createMetadata({
    path: blogPath(post.slug),
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt
  });
  if (!post.featuredImage) return { ...base, openGraph: { ...base.openGraph, type: "article" } };

  const image = { url: post.featuredImage, alt: post.title };
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: [image]
    },
    twitter: { ...base.twitter, images: [post.featuredImage] }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await loadBlogPost((await params).slug);
  if (!post) notFound();

  const url = absoluteUrl(blogPath(post.slug));

  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              "@id": `${url}#article`,
              mainEntityOfPage: url,
              url,
              headline: post.title,
              description: post.metaDescription ?? post.excerpt,
              image: [post.featuredImage ?? ogImage.url],
              datePublished: post.publishedAt,
              dateModified: post.updatedAt,
              author: { "@id": `${siteUrl}/#organization` },
              publisher: { "@id": `${siteUrl}/#organization` },
              isPartOf: { "@id": `${absoluteUrl("/blog")}#blog` },
              inLanguage: "en"
            },
            {
              "@type": "BreadcrumbList",
              "@id": `${url}#breadcrumb`,
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
                { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
                { "@type": "ListItem", position: 3, name: post.title, item: url }
              ]
            }
          ]
        }}
      />
      <Navbar />
      <article className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-3xl">
          <Link className={CONTENT_TEXT_LINK} href="/blog">
            <ArrowLeft aria-hidden="true" size={16} />
            All posts
          </Link>
          <p className={`mt-6 ${CONTENT_EYEBROW}`}>
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
          </p>
          <h1 className={`mt-3 ${CONTENT_H1}`}>{post.title}</h1>
          {post.excerpt ? (
            <p className="mt-5 text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">{post.excerpt}</p>
          ) : null}
          {post.featuredImage ? (
            // Holo hosts images on hosts we don't control, so next/image's allowlist doesn't fit.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={post.title}
              className="mt-8 aspect-[16/9] w-full rounded-[20px] border border-outline/70 object-cover"
              fetchPriority="high"
              src={post.featuredImage}
            />
          ) : null}
          <div className="blog-prose mt-10" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          <p className="mt-12 border-t border-outline/70 pt-6 text-sm text-onSurfaceVariant">
            Published by {siteName}.{" "}
            <Link className="font-bold text-brandBlue" href="/destinations">
              Browse travel eSIMs for 200+ destinations
            </Link>
            .
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
