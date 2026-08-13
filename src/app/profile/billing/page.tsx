import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard, Lock, WifiOff } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { BillingForm } from "./BillingForm";

export const metadata: Metadata = createMetadata({
  path: "/profile/billing",
  title: "Payments and billing | eSim2you",
  description: "Manage the billing address used for your eSim2you purchases.",
  indexable: false
});

type SavedCard = {
  brand: string;
  last4: string;
  nameOnCard: string;
  expiry: string;
} | null;

export default async function BillingPage() {
  const basePath = "/profile/billing";

  const [addressResult, cardResult] = await Promise.all([
    fetchForPage<{ billingAddress: BillingAddress | null }>("/user/billing-address", basePath),
    fetchForPage<{ card: SavedCard }>("/user/card-details", basePath)
  ]);

  const card = cardResult.ok ? cardResult.data.card : null;

  return (
    <main className="min-h-screen bg-[#040d1a] text-white">
      <Navbar />

      <section className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-28 lg:px-10">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-[#8ea3ba] transition hover:text-white"
          href="/profile"
        >
          <ArrowLeft size={14} />
          Profile
        </Link>

        <h1 className="mt-7 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
          Payments and billing
        </h1>
        <p className="mt-2 text-sm text-[#8ea3ba]">
          Where your receipts are addressed, and how your card is handled.
        </p>

        <div className="mt-8 rounded-[20px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] p-6 sm:p-8">
          <h2 className="font-display text-xl font-black">Billing address</h2>
          <p className="mt-2 text-sm text-[#8ea3ba]">
            Used on the receipts for your eSIM purchases.
          </p>

          {addressResult.ok ? (
            <BillingForm initialAddress={addressResult.data.billingAddress} />
          ) : (
            <div className="mt-6 flex items-center gap-4 rounded-[14px] border border-[#7a4b1c] bg-[#1b1207] px-5 py-4">
              <WifiOff aria-hidden="true" className="shrink-0 text-[#ffb454]" size={20} />
              <div>
                <p className="text-sm font-bold">We couldn&apos;t load your address</p>
                <p className="mt-1 text-sm text-[#c9b393]">{addressResult.message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[20px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] p-6 sm:p-8">
          <h2 className="flex items-center gap-2.5 font-display text-xl font-black">
            <Lock aria-hidden="true" className="text-[#58baff]" size={20} />
            Cards are entered at checkout
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#8ea3ba]">
            We never store your card. Every payment is taken on Pokpay&apos;s hosted
            checkout, so your card details are entered there and stay with the payment
            provider.
          </p>

          {card ? (
            <div className="mt-6 flex items-center gap-4 rounded-[14px] border border-[#214867] bg-[#061427]/85 px-5 py-4">
              <CreditCard aria-hidden="true" className="shrink-0 text-[#58baff]" size={20} />
              <div>
                <p className="text-sm font-bold">
                  {card.brand} ending {card.last4}
                </p>
                <p className="mt-0.5 text-xs text-[#8ea3ba]">
                  {card.nameOnCard} · expires {card.expiry}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
