// E-SIM-frontend/src/app/destinations/BoardingPassStepperCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import planePathAnimation from "@/../public/lottie/plane-path.json";
import stampAnimation from "@/../public/lottie/stamp.json";
import { frameForStep, newlyDoneIndices } from "./boardingPassStepper";

const TOTAL_STEPS = 3;

type BoardingPassStepperProps = {
  activeIndex: 0 | 1 | 2;
  stepLabels: readonly [string, string, string];
  reduceMotion: boolean;
};

/**
 * The wizard's step header, styled as a boarding pass to match
 * WizardWelcomeIntro's loader. The route strip is driven imperatively to a
 * frame representing progress (never freely animated), so there's no tween
 * to disable for reduced motion. The stamp badge is the one genuinely
 * animated beat, and only it checks `reduceMotion`.
 */
export function BoardingPassStepper({
  activeIndex,
  stepLabels,
  reduceMotion,
}: BoardingPassStepperProps) {
  const planeRef = useRef<LottieRefCurrentProps>(null);
  const [planeTotalFrames, setPlaneTotalFrames] = useState<number | null>(null);
  const previousIndexRef = useRef(activeIndex);
  const [doneIndices, setDoneIndices] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    if (planeTotalFrames === null) return;
    const frame = frameForStep(activeIndex, TOTAL_STEPS, planeTotalFrames);
    planeRef.current?.goToAndStop(frame, true);
  }, [activeIndex, planeTotalFrames]);

  useEffect(() => {
    const newlyDone = newlyDoneIndices(previousIndexRef.current, activeIndex);
    previousIndexRef.current = activeIndex;
    if (newlyDone.length === 0) return;
    setDoneIndices((current) => new Set([...current, ...newlyDone]));
  }, [activeIndex]);

  return (
    <div className="relative mb-5 overflow-hidden rounded-[18px] bg-gradient-to-br from-brandBlue to-brandTeal px-[18px] pb-[14px] pt-4 text-white">
      <span className="absolute left-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white" />
      <span className="absolute right-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white" />

      <div className="mb-2.5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] opacity-85">
        <span>Help me choose</span>
        <span>
          Step {activeIndex + 1} / {TOTAL_STEPS}
        </span>
      </div>

      <div
        className={`rounded-xl bg-white/95 px-2.5 py-1.5 transition-opacity duration-150 ${
          planeTotalFrames === null ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      >
        <Lottie
          lottieRef={planeRef}
          animationData={planePathAnimation}
          loop={false}
          autoplay={false}
          className="h-10 w-full"
          onDOMLoaded={() => {
            const frames = planeRef.current?.animationItem?.totalFrames;
            if (frames) setPlaneTotalFrames(frames);
          }}
        />
      </div>

      <div className="mt-2 flex justify-between">
        {stepLabels.map((label, index) => {
          const isActive = index === activeIndex;
          const isDone = doneIndices.has(index);
          return (
            <div
              key={label}
              className={`relative flex-1 text-center text-[9.5px] font-bold ${
                isActive ? "opacity-100" : isDone ? "opacity-90" : "opacity-70"
              }`}
            >
              {isDone ? <StampBadge reduceMotion={reduceMotion} /> : null}
              <span className="mb-0.5 block text-[8px] opacity-70">
                {String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StampBadge({ reduceMotion }: { reduceMotion: boolean }) {
  const stampRef = useRef<LottieRefCurrentProps>(null);

  return (
    <div
      className="absolute left-1/2 top-[-30px] h-11 w-11 -translate-x-1/2"
      aria-hidden="true"
    >
      <Lottie
        lottieRef={stampRef}
        animationData={stampAnimation}
        loop={false}
        autoplay={!reduceMotion}
        onDOMLoaded={() => {
          if (!reduceMotion) return;
          const frames = stampRef.current?.animationItem?.totalFrames;
          if (frames) stampRef.current?.goToAndStop(frames - 1, true);
        }}
      />
    </div>
  );
}
