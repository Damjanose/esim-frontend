import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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
  title: "Checkout | eSim2you",
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
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[1040px] px-5 pb-24 pt-28 lg:px-10">
        <p className="text-xs font-bold text-brandBlue">Secure checkout</p>

        <h1 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          {plan.title}
        </h1>

        <p className="mt-2 max-w-[52ch] text-sm text-onSurfaceVariant">
          Review your plan and pay below. Your eSIM and QR code are delivered to your account
          the moment payment clears.
        </p>

        <CheckoutPriceSection accountEmail={accountEmail} countries={countries} plan={plan} />
      </section>

      <SiteFooter />
    </main>
  );
}
