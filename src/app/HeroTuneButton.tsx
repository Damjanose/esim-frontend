"use client";

import { SlidersHorizontal } from "lucide-react";
import { requestPlanWizard } from "./destinations/planWizardOpener";

/**
 * The app's filter tile next to search: dark glass on the hero, same 56px
 * height as the search field. Opens the Help Me Choose wizard that
 * DestinationBrowse owns (one instance per page) through planWizardOpener.
 * It never renders a wizard itself.
 */
export function HeroTuneButton() {
  return (
    <button
      aria-label="Help me choose a plan"
      className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] border border-white/25 bg-white/10 text-white transition hover:border-white/45 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      onClick={() => requestPlanWizard()}
      title="Help me choose a plan"
      type="button"
    >
      <SlidersHorizontal aria-hidden="true" size={22} />
    </button>
  );
}
