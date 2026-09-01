import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Database, Globe2, Phone, ShieldCheck } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getPackageOption } from "@/services/server-packages";
import { discountPercentOff, formatOriginalPrice, hasActiveDiscount } from "@/services/discountPricing";
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
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-28 lg:px-10">
        <div className="mx-auto w-full max-w-[560px]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brandBlue">
            Secure checkout
          </p>

          <h1 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
            {plan.title}
          </h1>

          <p className="mt-2 text-sm text-onSurfaceVariant">
            Review your plan before paying. Your eSIM is delivered instantly after payment.
          </p>

          <div className="mt-8 rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
            <div className="flex items-center gap-4">
              {plan.flagUri ? (
                <img
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                  src={plan.flagUri}
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full border border-outline bg-mist text-brandBlue">
                  <Globe2 size={22} />
                </span>
              )}

              <div>
                <p className="font-display text-lg font-black text-brandInk">{plan.country}</p>
                <p className="text-xs text-onSurfaceVariant">{plan.title}</p>
              </div>
            </div>

            <dl className="mt-7 space-y-4 border-t border-outline pt-6">
              {rows.map((row) => (
                <div className="flex items-center justify-between gap-4" key={row.label}>
                  <dt className="flex items-center gap-2.5 text-sm text-onSurfaceVariant">
                    <row.icon aria-hidden="true" className="text-brandBlue" size={16} />
                    {row.label}
                  </dt>
                  <dd className="text-sm font-bold text-brandInk">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-end justify-between border-t border-outline pt-6">
              <span className="text-sm text-onSurfaceVariant">Total</span>
              <span className="flex items-center gap-2.5">
                {hasActiveDiscount(plan) ? (
                  <>
                    {discountPercentOff(plan) != null ? (
                      <span className="rounded-full bg-error/10 px-2 py-1 text-[10px] font-black text-error">
                        -{discountPercentOff(plan)}%
                      </span>
                    ) : null}
                    <span className="text-sm font-semibold text-onSurfaceVariant line-through">
                      {formatOriginalPrice(plan)}
                    </span>
                  </>
                ) : null}
                <span className="font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
                  {plan.price}
                </span>
              </span>
            </div>

            <PayButton packageId={plan.id} />
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-outline bg-mist px-5 py-4 text-xs text-onSurfaceVariant">
            <ShieldCheck aria-hidden="true" className="shrink-0 text-brandBlue" size={18} />
            <span>
              Payments are handled by Pokpay. eSim2you never sees your card details.
            </span>
          </div>

          <p className="mt-6 text-center text-xs text-onSurfaceVariant">
            Changed your mind?{" "}
            <Link className="font-semibold text-brandBlue hover:text-brandInk" href="/destinations">
              Browse other destinations
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
