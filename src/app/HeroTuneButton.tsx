"use client";

import { SlidersHorizontal } from "lucide-react";
import { requestPlanWizard } from "./destinations/planWizardOpener";

/**
 * The app's filter tile next to search. Opens the Help Me Choose wizard that
 * DestinationBrowse owns (one instance per page) through planWizardOpener.
 * It never renders a wizard itself.
 */
export function HeroTuneButton() {
  return (
    <button
      aria-label="Help me choose a plan"
      className="grid h-[78px] w-[60px] shrink-0 place-items-center rounded-[20px] border border-outline bg-surface text-brandBlue shadow-brandCard transition hover:border-brandBlue/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue sm:w-[78px]"
      onClick={() => requestPlanWizard()}
      title="Help me choose a plan"
      type="button"
    >
      <SlidersHorizontal aria-hidden="true" size={22} />
    </button>
  );
}
