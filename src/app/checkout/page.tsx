import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CalendarClock, Database, Globe2, Phone } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { getPackageOption } from "@/services/server-packages";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { CheckoutPriceSection } from "./CheckoutPriceSection";

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

            <CheckoutPriceSection accountEmail={accountEmail} plan={plan} />
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
