import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard, Lock, WifiOff } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { backendFetch } from "@/lib/backend";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { accountShellItems } from "../../account/accountShellItems";
import { AccountShell } from "../../components/AccountShell";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { SiteFooter } from "../../SiteFooter";
import { BillingForm } from "./BillingForm";

type EsimCountry = { code: string; name: string; geography: string };

export const metadata: Metadata = createMetadata({
  path: "/profile/billing",
  title: "Payments and billing | eSIM2you",
  description: "Manage the billing address used for your eSIM2you purchases.",
  indexable: false
});

type SavedCard = {
  brand: string;
  last4: string;
  nameOnCard: string;
  expiry: string;
} | null;

const CARD_CLASSES = "rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6";

export default async function BillingPage() {
  const basePath = "/profile/billing";

  const [addressResult, cardResult, countriesResult] = await Promise.all([
    fetchForPage<{ billingAddress: BillingAddress | null }>("/user/billing-address", basePath),
    fetchForPage<{ card: SavedCard }>("/user/card-details", basePath),
    backendFetch<{ countries: EsimCountry[] }>("/esim/countries")
  ]);

  const card = cardResult.ok ? cardResult.data.card : null;
  // Only real countries have a genuine ISO alpha-2 code — Airalo's
  // regional/global bundle pseudo-entries ("AFR") don't and would fail
  // billing-address validation if offered here.
  const countries = countriesResult.ok
    ? countriesResult.data.countries
        .filter((country) => country.geography === "local")
        .map((country) => ({ code: country.code, name: country.name }))
    : [];

  return (
    // overflow-x-clip, not -hidden, so the AccountShell sidebar sticks (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell
          footer={<SignOutButton appearance="nav" />}
          items={accountShellItems("payments")}
          label="Account"
        >
          <div className="max-w-[720px]">
            <Link
              className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
              href="/profile"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              Profile
            </Link>

            <h1 className="mt-3 px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
              Payments and billing
            </h1>
            <p className="mt-1 px-1 text-sm text-onSurfaceVariant">
              Where your receipts are addressed, and how your card is handled.
            </p>

            <section className={`mt-6 ${CARD_CLASSES}`}>
              <h2 className="font-display text-xl font-black text-brandInk">Billing address</h2>
              <p className="mt-2 text-sm text-onSurfaceVariant">
                Used on the receipts for your eSIM purchases.
              </p>

              {addressResult.ok ? (
                <BillingForm countries={countries} initialAddress={addressResult.data.billingAddress} />
              ) : (
                <div className="mt-5 flex items-center gap-4 rounded-[14px] border border-error/30 bg-error/5 px-5 py-4">
                  <WifiOff aria-hidden="true" className="shrink-0 text-error" size={20} />
                  <div>
                    <p className="text-sm font-bold text-brandInk">We couldn&apos;t load your address</p>
                    <p className="mt-1 text-sm text-onSurfaceVariant">{addressResult.message}</p>
                  </div>
                </div>
              )}
            </section>

            <section className={`mt-4 ${CARD_CLASSES}`}>
              <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
                <Lock aria-hidden="true" className="text-brandBlue" size={20} />
                Cards are entered at checkout
              </h2>
              <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
                We never store your card. Your card details are entered directly with
                Pokpay at checkout and never touch our servers.
              </p>

              {card ? (
                <div className="mt-5 flex items-center gap-4 rounded-[14px] border border-outline/60 bg-surfaceBright px-5 py-4">
                  <CreditCard aria-hidden="true" className="shrink-0 text-brandBlue" size={20} />
                  <div>
                    <p className="text-sm font-bold text-brandInk">
                      {card.brand} ending {card.last4}
                    </p>
                    <p className="mt-0.5 text-xs text-onSurfaceVariant">
                      {card.nameOnCard} · expires {card.expiry}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
