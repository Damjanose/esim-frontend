import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { destinationPages } from "@/content/seo-pages";
import { destinationDisplay } from "@/lib/esim-routes";
import { getDestinationOffer } from "@/lib/destinationPricing";

/**
 * Server-rendered links from the homepage to the main /esim money pages.
 * DestinationBrowse builds its links client-side, so without this block the
 * homepage HTML had no crawlable links to any /esim page. Ordered by market
 * priority (US, UK, Europe first).
 */
export const TOP_DESTINATION_SLUGS = [
  "usa",
  "uk",
  "europe",
  "japan",
  "turkey",
  "france",
  "italy",
  "spain",
  "thailand",
  "mexico",
  "canada",
  "uae"
] as const;

export async function TopDestinationLinks() {
  const destinations = await Promise.all(
    TOP_DESTINATION_SLUGS.flatMap((slug) => {
      const page = destinationPages.find((entry) => entry.slug === slug);
      const name = destinationDisplay[slug]?.countryName;
      if (!page || !name) return [];
      return [getDestinationOffer(slug).then((offer) => ({ slug, name, href: page.path, offer }))];
    })
  );

  return (
    <section
      aria-labelledby="top-destinations-heading"
      className="bg-surface px-5 py-10 text-onSurface md:px-8"
      id="top-destinations"
    >
      <div className="mx-auto max-w-[1280px]">
        <h2
          className="text-center font-display text-3xl font-black tracking-[-0.03em] text-brandInk"
          id="top-destinations-heading"
        >
          Travel eSIM plans for popular trips
        </h2>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {destinations.map(({ slug, name, href, offer }) => (
            <li key={slug}>
              <Link
                className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-outline bg-surface p-4 shadow-brandCard transition hover:border-brandBlue/50"
                href={href}
              >
                <span className="min-w-0">
                  <span className="block font-display text-base font-black text-brandInk">
                    {name} eSIM
                  </span>
                  {offer ? (
                    <span className="mt-1 block text-xs font-bold text-onSurfaceVariant">
                      from €{offer.lowPrice.toFixed(2)}
                    </span>
                  ) : null}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="shrink-0 text-brandBlue transition group-hover:translate-x-0.5"
                  size={18}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
