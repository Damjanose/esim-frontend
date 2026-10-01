import Link from "next/link";
import type { ReactNode } from "react";

/** CollapsedCountryBar watches this element: the bar appears once the banner has scrolled away. */
export const COUNTRY_BANNER_ID = "country-banner";

type CountryBannerProps = {
  /** Current page, the last breadcrumb item. */
  crumb: string;
  /** A `fill` next/image. The brand gradient shows until (or instead of) it. */
  photo?: ReactNode;
  /** Photo credit, pinned to the bottom-right corner, out of flow so it can't shift the layout. */
  credit?: ReactNode;
  children: ReactNode;
};

/**
 * Country hero for /esim/[slug] and the live plans view: a full-bleed photo
 * banner with a rounded bottom (app CountryHero), under the floating navbar.
 * The navbar capsule ends 68px down below lg and 76px at lg, so the content
 * starts 24px under it.
 */
export function CountryBanner({ crumb, photo, credit, children }: CountryBannerProps) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-b-[24px] bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal"
      id={COUNTRY_BANNER_ID}
    >
      {photo ? <div className="absolute inset-0 -z-20">{photo}</div> : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-brandInk/95 via-brandInk/70 to-brandInk/40"
      />

      <div className="mx-auto max-w-6xl px-5 pb-8 pt-[92px] md:px-8 lg:pb-12 lg:pt-[100px]">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-surface/70">
          <Link className="transition hover:text-surface" href="/">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link className="transition hover:text-surface" href="/destinations">
            Destinations
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-surface">
            {crumb}
          </span>
        </nav>

        {children}
      </div>

      {credit ? <div className="absolute bottom-2 right-4 text-[10px] text-surface/50">{credit}</div> : null}
    </section>
  );
}
