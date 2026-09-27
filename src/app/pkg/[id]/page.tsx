import type { Metadata } from "next";
import { CalendarClock, Database, Globe2, Phone } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { landingContent } from "@/content/landing";
import { getPackageOption } from "@/services/server-packages";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { OpenAppActions } from "./OpenAppActions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const plan = await getPackageOption(safeDecode(id));
  return createMetadata({
    path: `/pkg/${id}`,
    title: plan ? `${plan.country} eSIM · ${plan.title} | eSim2you` : "eSIM plan | eSim2you",
    description: plan
      ? `${plan.title} for ${plan.price}. Open it in the eSim2you app or buy it on the web.`
      : "Open this eSIM plan in the eSim2you app, or download the app to get it.",
    indexable: false
  });
}

/**
 * Landing for a package shared from the mobile app (`/pkg/{id}`).
 *
 * With the app installed, universal / App Links open the app before this page
 * loads. Reaching it means the app isn't installed, or the link was opened
 * somewhere links don't fire (in-app browsers, a debug build), so it shows the
 * plan itself and offers every next step: open in the app, buy on the web, or
 * download the app. It never gates the plan behind a download.
 */
export default async function PackageLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const packageId = safeDecode(id);
  const plan = await getPackageOption(packageId);
  const { appLinks } = landingContent;

  const rows = plan
    ? [
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
      ]
    : [];
  const coverage = plan?.countries ?? [];

  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[520px] px-5 pb-24 pt-28">
        <p className="text-xs font-bold text-brandBlue">Shared with you</p>

        {plan ? (
          <>
            <div className="mt-4 flex items-center gap-4">
              {plan.flagUri ? (
                <img alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" src={plan.flagUri} />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-outline bg-mist text-brandBlue">
                  <Globe2 size={22} />
                </span>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-brandInk sm:text-3xl">
                  {plan.country}
                </h1>
                <p className="text-sm text-onSurfaceVariant">{plan.title}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-outline/70 bg-white p-5">
              <dl>
                {rows.map(({ icon: Icon, label, value }) => (
                  <div className="flex items-center justify-between gap-4 py-1.5" key={label}>
                    <dt className="flex items-center gap-2 text-[13px] text-onSurfaceVariant">
                      <Icon aria-hidden="true" className="text-brandBlue" size={15} />
                      {label}
                    </dt>
                    <dd className="text-right text-[13px] font-bold text-brandInk">{value}</dd>
                  </div>
                ))}
              </dl>
              {coverage.length > 1 ? (
                <p className="mt-3 border-t border-outline/70 pt-3 text-xs text-onSurfaceVariant">
                  Covers {coverage.length} countries: {coverage.map((country) => country.title).join(", ")}
                </p>
              ) : null}
              <div className="mt-4 flex items-baseline justify-between border-t border-outline/70 pt-4">
                <span className="text-sm font-semibold text-onSurfaceVariant">Price</span>
                <span className="font-display text-2xl font-black text-brandInk">{plan.price}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-2xl font-black tracking-[-0.02em] text-brandInk sm:text-3xl">
              Get this eSIM plan in eSim2you
            </h1>
            <p className="mt-2 text-sm text-onSurfaceVariant">
              This plan is no longer available on the web. Open eSim2you to see the latest plans.
            </p>
          </>
        )}

        <OpenAppActions
          packageId={packageId}
          webCheckoutUrl={plan ? `/checkout?package=${encodeURIComponent(plan.id)}` : null}
          appStoreUrl={appLinks.ios.href}
          playStoreUrl={appLinks.android.href}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
