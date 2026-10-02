import { ChevronRight, Globe2 } from "lucide-react";
import Link from "next/link";

type CountryRowProps = {
  href: string;
  country: string;
  flagUri: string;
  planCount: number;
  /** Cheapest plan's display price (toCountryOptions). */
  fromPrice: string;
};

/** Compact "All destinations" card: flag, name and plan count, from-price, chevron. */
export function CountryRow({ href, country, flagUri, planCount, fromPrice }: CountryRowProps) {
  return (
    <Link
      className="group flex min-h-[60px] items-center gap-3 rounded-[16px] border border-outline/70 bg-surface px-3.5 py-2.5 transition hover:border-brandBlue/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue"
      href={href}
    >
      {flagUri ? (
        <img
          alt={`${country} flag`}
          className="h-9 w-9 shrink-0 rounded-full border border-outline object-cover"
          decoding="async"
          loading="lazy"
          src={flagUri}
        />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
          <Globe2 aria-hidden="true" size={16} />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-brandInk">{country}</span>
        <span className="block text-xs font-semibold text-onSurfaceVariant">
          {planCount} {planCount === 1 ? "plan" : "plans"}
        </span>
      </span>

      <span className="shrink-0 text-xs font-black text-brandBlue">from {fromPrice}</span>
      <ChevronRight
        aria-hidden="true"
        className="shrink-0 text-onSurfaceVariant transition group-hover:text-brandBlue"
        size={16}
      />
    </Link>
  );
}
