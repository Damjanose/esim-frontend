import { SearchX } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { LinkButton } from "../components/Button";
import { SiteFooter } from "../SiteFooter";

export default function CheckoutNotFound() {
  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-5 pb-24 pt-32 text-center lg:px-10">
        <span className="grid h-14 w-14 place-items-center rounded-[16px] border border-outline bg-mist text-brandBlue">
          <SearchX size={26} />
        </span>

        <h1 className="mt-6 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          We couldn&apos;t find that plan
        </h1>

        <p className="mt-3 max-w-[520px] text-sm leading-6 text-onSurfaceVariant">
          The plan in this link is no longer in our catalog. Prices and packages change
          regularly — browse current plans to find the right one for your trip.
        </p>

        <LinkButton className="mt-8" href="/destinations" size="lg">
          Browse destinations
        </LinkButton>
      </section>

      <SiteFooter />
    </main>
  );
}
