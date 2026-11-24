import type { Metadata } from "next";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { CONTENT_EYEBROW, CONTENT_GUTTER, CONTENT_H1, CONTENT_TOP } from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { absoluteUrl, createMetadata, siteName, siteUrl } from "@/lib/seo";
import { SoroBlog } from "./SoroBlog";

const title = "Travel eSIM blog";
const description =
  "Travel eSIM news, destination tips and guides to staying connected abroad, from the eSIM2you team.";

export const metadata: Metadata = createMetadata({ path: "/blog", title, description });

// Posts come from the Soro embed in the browser; the page itself is static.
export default function BlogIndexPage() {
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
          inLanguage: "en"
        }}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <p className={CONTENT_EYEBROW}>Blog</p>
          <h1 className={`mt-3 max-w-4xl ${CONTENT_H1}`}>{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">{description}</p>
          <SoroBlog />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
