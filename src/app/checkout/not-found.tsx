import Link from "next/link";
import { SearchX } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";

export default function CheckoutNotFound() {
  return (
    <main className="min-h-screen bg-[#040d1a] text-white">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-5 pb-24 pt-32 text-center lg:px-10">
        <span className="grid h-14 w-14 place-items-center rounded-[16px] border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
          <SearchX size={26} />
        </span>

        <h1 className="mt-6 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
          We couldn&apos;t find that plan
        </h1>

        <p className="mt-3 max-w-[520px] text-sm leading-6 text-[#8ea3ba]">
          The plan in this link is no longer in our catalog. Prices and packages change
          regularly — browse current plans to find the right one for your trip.
        </p>

        <Link
          className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-7 text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5"
          href="/destinations"
        >
          Browse destinations
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
