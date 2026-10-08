import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { loadLocalCountries } from "@/lib/tripPlan/countries";
import { isPlanId } from "@/lib/tripPlan/logic";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { TripPlanDetail } from "./TripPlanDetail";

export const metadata: Metadata = createMetadata({
  path: "/trip-plan",
  title: "Your trip plan | eSIM2you",
  description: "Your day-by-day trip plan.",
  indexable: false
});

export default async function TripPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPlanId(id)) notFound();

  const jar = await cookies();
  const accountEmail = readEmailFromAccessToken(jar.get(ACCESS_COOKIE)?.value);
  const countries = await loadLocalCountries();

  return (
    // overflow-x-clip, not -hidden: CardStep's sticky Pay bar must still stick (f215).
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <Navbar />
      {/* px-4 sm:px-6 is the gutter CardStep's sticky Pay bar bleeds into (-mx-4 sm:-mx-6). */}
      <section className="mx-auto w-full max-w-[880px] px-4 pb-16 pt-[92px] sm:px-6 lg:pb-24 lg:pt-[108px]">
        <TripPlanDetail accountEmail={accountEmail} countries={countries} planId={id} />
      </section>
      <SiteFooter />
    </main>
  );
}
