import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { CONTENT_CARD, CONTENT_CARD_LINK, CONTENT_EYEBROW, CONTENT_GUTTER, CONTENT_H1, CONTENT_TOP } from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { blogPath, formatBlogDate, loadBlogPosts } from "@/lib/blog";
import { absoluteUrl, createMetadata, siteName, siteUrl } from "@/lib/seo";

// Must be a literal for Next; keep it equal to BLOG_REVALIDATE_SECONDS.
export const revalidate = 3600;

const title = "Travel eSIM blog";
const description =
  "Travel eSIM news, destination tips and guides to staying connected abroad, from the eSIM2you team.";

export const metadata: Metadata = createMetadata({ path: "/blog", title, description });

export default async function BlogIndexPage() {
  const posts = await loadBlogPosts();
  const url = absoluteUrl("/blog");

  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "@id": `${url}#blog`,
          url,
          name: `${siteName} blog`,
          description,
          isPartOf: { "@id": `${siteUrl}/#website` },
          publisher: { "@id": `${siteUrl}/#organization` },
          inLanguage: "en",
          blogPost: posts.slice(0, 20).map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            url: absoluteUrl(blogPath(post.slug)),
            datePublished: post.publishedAt,
            dateModified: post.updatedAt
          }))
        }}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <p className={CONTENT_EYEBROW}>Blog</p>
          <h1 className={`mt-3 max-w-4xl ${CONTENT_H1}`}>{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">{description}</p>

          {posts.length === 0 ? (
            <div className={`mt-10 ${CONTENT_CARD}`}>
              <p className="text-body-md text-onSurfaceVariant">
                No posts yet. Meanwhile, our{" "}
                <Link className="font-bold text-brandBlue" href="/travel">
                  travel eSIM guides
                </Link>{" "}
                cover the essentials.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link className={`${CONTENT_CARD_LINK} overflow-hidden`} href={blogPath(post.slug)} key={post.slug}>
                  {post.featuredImage ? (
                    // Holo hosts images on hosts we don't control, so next/image's allowlist doesn't fit.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="-mx-5 -mt-5 mb-5 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none object-cover sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)]"
                      decoding="async"
                      loading="lazy"
                      src={post.featuredImage}
                    />
                  ) : null}
                  <p className="text-label-caps uppercase text-onSurfaceVariant">
                    <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
                  </p>
                  <h2 className="mt-2 font-display text-headline-md font-black text-brandInk">{post.title}</h2>
                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-body-md text-onSurfaceVariant">{post.excerpt}</p>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-brandBlue">
                    Read post
                    <ArrowRight aria-hidden="true" className="motion-safe:transition group-hover:translate-x-0.5" size={16} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
