"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Check } from "lucide-react";
import flightLoaderAnimation from "@/../public/lottie/Flight-loader.json";
import { generatingEtaIndex, generatingStepsDone } from "@/lib/tripPlan/logic";

const STEP_MS = 8000;
const SLOW_MS = 45_000;
/** Past this, say plainly that leaving is safe: the backend saves the plan either way. */
const LEAVE_OK_MS = 120_000;

const ETAS = [
  "This usually takes 30–60 seconds",
  "Great start. Now building each day",
  "Almost there. Adding the finishing touches"
];
const SLOW_ETA = "Taking a little longer than usual. Hang tight";

/**
 * Full-screen loader while one long create/edit request is in flight (the app's
 * TripPlanGeneratingOverlay). Steps tick on a timer, never the last one: the
 * overlay closes when the request resolves.
 */
export function TripPlanGenerating({ title, steps }: { title: string; steps: string[] }) {
  const [elapsed, setElapsed] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, []);

  const done = generatingStepsDone(elapsed, STEP_MS, steps.length);
  const eta = [...ETAS, SLOW_ETA][generatingEtaIndex(elapsed, STEP_MS, ETAS.length, SLOW_MS)] ?? ETAS[0];

  return (
    <div
      aria-labelledby="trip-plan-generating-title"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-brandInk/60 px-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-[24px] border border-outline bg-surface px-7 pb-8 pt-8 text-center shadow-brandCard">
        <div className="mx-auto h-24 w-24">
          <Lottie animationData={flightLoaderAnimation} loop={!reduceMotion} autoplay={!reduceMotion} />
        </div>
        <h2
          className="mt-3 break-words font-display text-headline-md font-black text-brandInk"
          id="trip-plan-generating-title"
        >
          {title}
        </h2>
        <p aria-live="polite" className="mt-1 text-body-sm text-onSurfaceVariant" role="status">
          {eta}
        </p>

        <ul className="mt-6 space-y-2.5 text-left">
          {steps.map((step, index) => {
            const ticked = index < done;
            return (
              <li className="flex items-center gap-3 text-body-md" key={step}>
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                    ticked ? "bg-brandTeal text-white" : "border border-outline text-transparent"
                  }`}
                >
                  <Check aria-hidden="true" size={14} strokeWidth={3} />
                </span>
                <span className={ticked ? "font-semibold text-brandInk" : "text-onSurfaceVariant"}>{step}</span>
              </li>
            );
          })}
        </ul>

        {elapsed >= LEAVE_OK_MS ? (
          <p className="mt-6 rounded-[12px] bg-surfaceBright px-4 py-3 text-body-sm text-onSurfaceVariant">
            You can leave this page. Your plan keeps building and will show up under Your plans.
          </p>
        ) : null}
      </div>
    </div>
  );
}
