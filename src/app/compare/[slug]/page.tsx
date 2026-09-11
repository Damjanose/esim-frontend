import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../JsonLd";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { comparePages } from "@/content/compare-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return comparePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = comparePages.find((entry) => entry.slug === slug);
  if (!page) return {};
  return createMetadata({
    path: page.path,
    title: page.title,
    description: page.description
  });
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const page = comparePages.find((entry) => entry.slug === slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-white text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: page.heading,
          description: page.description,
          breadcrumbName: page.heading,
          parent: { name: "Compare", path: "/compare" }
        })}
      />
      <Navbar />
      <article className="px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-onSurfaceVariant">
            <Link className="hover:text-brandBlue" href="/">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="hover:text-brandBlue" href="/compare">
              Compare
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-brandInk">{page.heading}</span>
          </nav>
          <h1 className="mt-8 font-display text-5xl font-black text-brandInk">{page.heading}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-onSurfaceVariant">{page.intro}</p>
          <div className="mt-10 overflow-x-auto rounded-xl border border-outline bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-mist font-black text-brandInk">
                <tr>
                  <th className="px-4 py-3" scope="col">
                    Factor
                  </th>
                  <th className="px-4 py-3" scope="col">
                    eSIM2you
                  </th>
                  <th className="px-4 py-3" scope="col">
                    {page.competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.rows.map((row) => (
                  <tr className="border-t border-outline" key={row.factor}>
                    <th className="px-4 py-3 font-bold text-brandInk" scope="row">
                      {row.factor}
                    </th>
                    <td className="px-4 py-3 text-onSurfaceVariant">{row.esim2you}</td>
                    <td className="px-4 py-3 text-onSurfaceVariant">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-8 list-disc space-y-2 pl-5 text-onSurfaceVariant">
            {page.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="mt-8">
            <Link className="font-black text-brandBlue" href="/destinations">
              Browse eSIM2you destinations
            </Link>
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
