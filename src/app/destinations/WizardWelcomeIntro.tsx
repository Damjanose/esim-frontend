"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import flightLoaderAnimation from "@/../public/lottie/Flight-loader.json";

const STATUS_PHRASES = [
  "Checking live coverage",
  "Comparing data plans",
  "Matching your trip"
];

const STATUS_INTERVAL_MS = 1400;

/**
 * Shown for a couple of seconds before the "Help me choose" wizard
 * auto-opens on the homepage, so the wizard doesn't just snap open the
 * instant the page loads. How long it stays on screen is controlled by the
 * parent (DestinationBrowse); clicking outside it calls `onDismiss` so the
 * user can back out of the auto-open flow entirely, mirroring the wizard's
 * own outside-click-to-close behavior.
 *
 * Styled as a boarding pass — the one visual idea this screen is built
 * around — to carry the "flight loader" animation's theme through the
 * copy and layout instead of stacking it in front of a generic spinner.
 */
export function WizardWelcomeIntro({ onDismiss }: { onDismiss: () => void }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setStatusIndex((index) => (index + 1) % STATUS_PHRASES.length);
    }, STATUS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-midnight/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-[24px] border border-outline bg-surface text-center shadow-brandCard"
        onClick={(event) => event.stopPropagation()}
        style={{ animation: "welcome-fade-scale 0.5s ease-out" }}
      >
        <div className="flex w-full flex-col items-center gap-4 px-10 pb-8 pt-10">
          <div className="h-24 w-24" role="status" aria-label="Loading">
            <Lottie animationData={flightLoaderAnimation} loop={!reduceMotion} />
          </div>

          <h2 className="font-display text-2xl font-black text-brandInk">
            Let&apos;s find your perfect eSIM
          </h2>

          <p className="max-w-xs text-sm text-onSurfaceVariant">
            Answer three quick questions and we&apos;ll match you with the
            right plan.
          </p>
        </div>

        <div className="w-full border-t border-dashed border-outline px-8 py-5">
          <div className="flex items-center justify-between font-mono text-label-caps uppercase text-onSurfaceVariant">
            <span>Route</span>
            <span className="text-brandInk">You &rarr; Anywhere</span>
          </div>

          <div className="mt-3 flex items-center justify-between font-mono text-label-caps uppercase text-onSurfaceVariant">
            <span>Status</span>
            <span aria-live="polite" className="text-brandTeal">
              {STATUS_PHRASES[statusIndex]}
            </span>
          </div>

          <div className="relative mt-3 h-1 w-full overflow-hidden rounded-full bg-outline/40">
            <span className="absolute inset-y-0 left-0 w-1/3 animate-runway-sweep rounded-full bg-gradient-to-r from-brandBlue to-brandTeal" />
          </div>
        </div>
      </div>
    </div>
  );
}
