import { SearchX } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { LinkButton } from "../components/Button";
import { SiteFooter } from "../SiteFooter";

export default function CheckoutNotFound() {
  return (
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-28">
        <div className="flex w-full max-w-[560px] flex-col items-center rounded-[24px] border border-outline/70 bg-surface p-6 text-center shadow-brandCard sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
            <SearchX aria-hidden="true" size={26} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
            We couldn&apos;t find that plan
          </h1>

          <p className="mt-3 max-w-[520px] text-sm leading-6 text-onSurfaceVariant">
            The plan in this link is no longer in our catalog. Prices and packages change
            regularly — browse current plans to find the right one for your trip.
          </p>

          <LinkButton className="mt-7 w-full sm:w-auto" href="/destinations" size="lg">
            Browse destinations
          </LinkButton>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
