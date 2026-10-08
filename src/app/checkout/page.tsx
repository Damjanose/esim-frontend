import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { backendFetch } from "@/lib/backend";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { getPackageOption } from "@/services/server-packages";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { CheckoutPriceSection } from "./CheckoutPriceSection";

type EsimCountry = { code: string; name: string; geography: string };

export const metadata: Metadata = createMetadata({
  path: "/checkout",
  title: "Checkout | eSIM2you",
  description: "Review your eSIM plan and pay securely.",
  indexable: false
});

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageId = "" } = await searchParams;
  const plan = await getPackageOption(packageId);

  if (!plan) {
    notFound();
  }

  const jar = await cookies();
  const accountEmail = readEmailFromAccessToken(jar.get(ACCESS_COOKIE)?.value);

  const countriesResult = await backendFetch<{ countries: EsimCountry[] }>("/esim/countries");
  const countries = countriesResult.ok
    ? countriesResult.data.countries
        .filter((country) => country.geography === "local")
        .map((country) => ({ code: country.code, name: country.name }))
    : [];

  return (
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the sticky summary (lg) and sticky Pay bar (phones) would never stick (f215).
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <Navbar />

      {/* px-4 sm:px-6 is the gutter CardStep's sticky Pay bar bleeds into (-mx-4 sm:-mx-6). */}
      <section className="mx-auto min-h-[calc(100svh+24px)] w-full max-w-[1120px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <CheckoutPriceSection accountEmail={accountEmail} countries={countries} plan={plan}>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brandBlue/10 px-3 py-1 text-xs font-bold text-brandBlue">
            <Lock aria-hidden="true" size={13} />
            Secure checkout
          </p>

          <h1 className="mt-3 break-words font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk sm:text-4xl">
            {plan.title}
          </h1>

          <p className="mt-2 max-w-[52ch] text-sm leading-6 text-onSurfaceVariant">
            Review your plan and pay below. Your eSIM and QR code are delivered to your account
            the moment payment clears.
          </p>
        </CheckoutPriceSection>
      </section>

      <SiteFooter />
    </main>
  );
}
