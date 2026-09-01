// E-SIM-frontend/src/app/destinations/BoardingPassStepperCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Plane } from "lucide-react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import stampAnimation from "@/../public/lottie/stamp.json";
import { newlyDoneIndices } from "./boardingPassStepper";

const TOTAL_STEPS = 3;
const DASH_COUNT = 5;
const DASH_STAGGER_MS = 90;

type BoardingPassStepperProps = {
  activeIndex: 0 | 1 | 2;
  stepLabels: readonly [string, string, string];
  reduceMotion: boolean;
};

/**
 * The wizard's step header, styled as a boarding pass. Each step is a node
 * (pending number / bouncing plane / stamped checkmark) connected by a
 * 5-dash track that lights up, one dash at a time, when the preceding step
 * completes.
 */
export function BoardingPassStepper({
  activeIndex,
  stepLabels,
  reduceMotion,
}: BoardingPassStepperProps) {
  const previousIndexRef = useRef(activeIndex);
  const [doneIndices, setDoneIndices] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const newlyDone = newlyDoneIndices(previousIndexRef.current, activeIndex);
    previousIndexRef.current = activeIndex;
    if (newlyDone.length === 0) return;
    setDoneIndices((current) => new Set([...current, ...newlyDone]));
  }, [activeIndex]);

  return (
    <div className="relative mb-5 overflow-hidden rounded-[18px] bg-gradient-to-br from-brandBlue to-brandTeal px-[18px] pb-4 pt-4 text-white">
      <span className="absolute left-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white" />
      <span className="absolute right-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white" />

      <div className="mb-3.5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] opacity-85">
        <span>Help me choose</span>
        <span>
          Step {activeIndex + 1} / {TOTAL_STEPS}
        </span>
      </div>

      <div className="flex items-center">
        {stepLabels.map((label, index) => {
          const isActive = index === activeIndex;
          const isDone = doneIndices.has(index);
          const isLast = index === stepLabels.length - 1;
          return (
            <div className={`flex items-center ${isLast ? "" : "flex-1"}`} key={label}>
              <StepNode
                index={index}
                isActive={isActive}
                isDone={isDone}
                label={label}
                reduceMotion={reduceMotion}
              />
              {isLast ? null : <DashTrack filled={isDone} reduceMotion={reduceMotion} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepNode({
  index,
  isActive,
  isDone,
  label,
  reduceMotion,
}: {
  index: number;
  isActive: boolean;
  isDone: boolean;
  label: string;
  reduceMotion: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] text-xs font-black ${
          isDone
            ? "border-white bg-white text-brandBlue"
            : isActive
              ? "border-white bg-white/15"
              : "border-white/40 bg-white/10 text-white/80"
        }`}
      >
        {isDone ? (
          <CheckmarkStamp reduceMotion={reduceMotion} />
        ) : isActive ? (
          <Plane
            aria-hidden="true"
            className={`h-4 w-4 ${reduceMotion ? "" : "animate-bounce"}`}
          />
        ) : (
          index + 1
        )}
      </div>
      <span
        className={`max-w-[15vw] truncate text-center text-[9.5px] font-bold leading-tight sm:max-w-none ${
          isActive ? "opacity-100" : isDone ? "opacity-90" : "opacity-70"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function CheckmarkStamp({ reduceMotion }: { reduceMotion: boolean }) {
  const stampRef = useRef<LottieRefCurrentProps>(null);

  return (
    <div className="h-6 w-6" aria-hidden="true">
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

function DashTrack({ filled, reduceMotion }: { filled: boolean; reduceMotion: boolean }) {
  return (
    <div
      className="mx-1.5 flex min-w-[10px] flex-1 items-center justify-center gap-[5px] overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: DASH_COUNT }).map((_, dashIndex) => (
        <span
          key={dashIndex}
          className={`h-[2.5px] min-w-[3px] flex-1 rounded-full transition-colors ${
            reduceMotion ? "duration-0" : "duration-150"
          } ${filled ? "bg-white" : "bg-white/25"}`}
          style={
            !reduceMotion && filled
              ? { transitionDelay: `${dashIndex * DASH_STAGGER_MS}ms` }
              : undefined
          }
        />
      ))}
    </div>
  );
}
