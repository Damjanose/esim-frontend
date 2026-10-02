import type { Metadata } from "next";
import { CalendarDays, FileDown, Wand2 } from "lucide-react";
import { createMetadata, createWebPageJsonLd } from "@/lib/seo";
import { SAMPLE_CAPTION, SAMPLE_DOC_VIEW } from "@/lib/tripPlan/sample";
import { loadLocalCountries } from "@/lib/tripPlan/countries";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { CONTENT_EYEBROW, CONTENT_GUTTER, CONTENT_H1, CONTENT_SECTION_H2, CONTENT_TOP } from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { TripPlanDocument } from "./TripPlanDocument";
import { TripPlanHome } from "./TripPlanHome";

const TITLE = "AI Trip Planner: Day-by-Day Itineraries | eSim2you";
const DESCRIPTION =
  "Tell us where you're going and for how long. Get a day-by-day travel itinerary with timed stops, transport tips and practical notes, then download it as a PDF.";

export const metadata: Metadata = createMetadata({ path: "/trip-plan", title: TITLE, description: DESCRIPTION });

export const revalidate = 3600;

const STEPS = [
  {
    icon: CalendarDays,
    title: "Tell us the trip",
    body: "Destination and number of days. Add cities, must-sees, a start date or how you get around if you like."
  },
  {
    icon: Wand2,
    title: "Get a day-by-day plan",
    body: "Timed stops for every day, transport strategy and practical notes. Preview it for free."
  },
  {
    icon: FileDown,
    title: "Unlock, refine, download",
    body: "Unlock the full plan, ask for changes in plain words, and download any version as a PDF."
  }
];

/**
 * Public trip-planner page. Static (so crawlable); TripPlanHome decides on the
 * client whether to show the form and plans or the sign-in card.
 */
export default async function TripPlanPage() {
  const countries = (await loadLocalCountries()).map((country) => country.name);

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createWebPageJsonLd({
          path: "/trip-plan",
          name: "AI Trip Planner",
          description: DESCRIPTION,
          breadcrumbName: "Trip planner"
        })}
      />
      <Navbar />

      <section className={`${CONTENT_TOP} ${CONTENT_GUTTER} pb-16 lg:pb-24`}>
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <div className="min-w-0">
            <p className={CONTENT_EYEBROW}>Trip planner</p>
            <h1 className={`mt-3 ${CONTENT_H1}`}>Your trip, planned day by day</h1>
            <p className="mt-4 max-w-[52ch] text-body-md text-onSurfaceVariant sm:text-base">
              Pick a destination and how long you&apos;re staying. You get an itinerary with timed stops, how to get
              around and the practical bits, ready to take offline as a PDF.
            </p>

            <div className="mt-8">
              <TripPlanHome countries={countries} />
            </div>
          </div>

          <aside aria-label="Sample trip plan" className="min-w-0 lg:sticky lg:top-[108px] lg:self-start">
            <p className="mb-3 text-body-sm font-semibold text-onSurfaceVariant">{SAMPLE_CAPTION}</p>
            <TripPlanDocument label="Sample trip plan for Tirana, Albania, one day, one traveller" view={SAMPLE_DOC_VIEW} />
          </aside>
        </div>
      </section>

      <section className={`border-t border-outline/70 bg-surfaceBright py-16 lg:py-20 ${CONTENT_GUTTER}`}>
        <div className="mx-auto max-w-6xl">
          <h2 className={CONTENT_SECTION_H2}>How it works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li className="rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-6" key={step.title}>
                <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
                  <step.icon aria-hidden="true" size={20} />
                </span>
                <h3 className="mt-4 font-display text-title-sm font-black text-brandInk">
                  {index + 1}. {step.title}
                </h3>
                <p className="mt-1.5 text-body-md text-onSurfaceVariant">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-body-sm text-onSurfaceVariant">
            Plans are shared with the eSim2you app: sign in with the same account and they show up in both.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
