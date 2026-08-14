import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Database, Globe2, Phone, ShieldCheck } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getPackageOption } from "@/services/server-packages";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { PayButton } from "./PayButton";

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

  const rows = [
    { icon: Globe2, label: "Destination", value: plan.country },
    { icon: Database, label: "Data", value: plan.dataLabel },
    { icon: CalendarClock, label: "Validity", value: plan.durationLabel },
    ...(plan.voiceMinutes || plan.smsCount
      ? [
          {
            icon: Phone,
            label: "Voice & SMS",
            value: [
              plan.voiceMinutes ? `${plan.voiceMinutes} min` : null,
              plan.smsCount ? `${plan.smsCount} SMS` : null
            ]
              .filter(Boolean)
              .join(" + ")
          }
        ]
      : [])
  ];

  return (
    <main className="min-h-screen bg-[#040d1a] text-white">
      <Navbar />

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-28 lg:px-10">
        <div className="mx-auto w-full max-w-[560px]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4eb5ff]">
            Secure checkout
          </p>

          <h1 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            {plan.title}
          </h1>

          <p className="mt-2 text-sm text-[#8ea3ba]">
            Review your plan before paying. Your eSIM is delivered instantly after payment.
          </p>

          <div className="mt-8 rounded-[20px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-8">
            <div className="flex items-center gap-4">
              {plan.flagUri ? (
                <img
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                  src={plan.flagUri}
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
                  <Globe2 size={22} />
                </span>
              )}

              <div>
                <p className="font-display text-lg font-black">{plan.country}</p>
                <p className="text-xs text-[#8196ad]">{plan.title}</p>
              </div>
            </div>

            <dl className="mt-7 space-y-4 border-t border-[#163958] pt-6">
              {rows.map((row) => (
                <div className="flex items-center justify-between gap-4" key={row.label}>
                  <dt className="flex items-center gap-2.5 text-sm text-[#8ea3ba]">
                    <row.icon aria-hidden="true" className="text-[#58baff]" size={16} />
                    {row.label}
                  </dt>
                  <dd className="text-sm font-bold">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-end justify-between border-t border-[#163958] pt-6">
              <span className="text-sm text-[#8ea3ba]">Total</span>
              <span className="font-display text-3xl font-black tracking-[-0.04em]">
                {plan.price}
              </span>
            </div>

            <PayButton packageId={plan.id} />
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-[#163958] bg-[#061427]/85 px-5 py-4 text-xs text-[#8ca0b7]">
            <ShieldCheck aria-hidden="true" className="shrink-0 text-[#4eb5ff]" size={18} />
            <span>
              Payments are handled by Pokpay. eSim2you never sees your card details.
            </span>
          </div>

          <p className="mt-6 text-center text-xs text-[#748aa2]">
            Changed your mind?{" "}
            <Link className="font-semibold text-[#42b1ff] hover:text-white" href="/destinations">
              Browse other destinations
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
