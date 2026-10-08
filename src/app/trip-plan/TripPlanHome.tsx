"use client";

import { useCallback, useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { fetchTripPlanConfig, fetchTripPlans } from "@/lib/tripPlan/client";
import { formatPlanPrice } from "@/lib/tripPlan/logic";
import type { ItineraryConfig, ItineraryListItem } from "@/lib/tripPlan/types";
import { TripPlanForm } from "./TripPlanForm";
import { TripPlanList } from "./TripPlanList";

type State =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "error"; message: string }
  | { kind: "ready"; config: ItineraryConfig; plans: ItineraryListItem[] };

/**
 * The signed-in part of /trip-plan. The page around it is static, so whether
 * the visitor is signed in is learned here from the BFF: a 401 shows the
 * sign-in card instead of the form.
 */
export function TripPlanHome({ countries }: { countries: string[] }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    const [config, plans] = await Promise.all([fetchTripPlanConfig(), fetchTripPlans()]);
    if (!config.ok) {
      setState(
        config.status === 401 ? { kind: "signedOut" } : { kind: "error", message: config.message }
      );
      return;
    }
    if (!plans.ok) {
      setState(plans.status === 401 ? { kind: "signedOut" } : { kind: "error", message: plans.message });
      return;
    }
    setState({ kind: "ready", config: config.data, plans: plans.data });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === "loading") {
    return (
      <div aria-busy="true" className="space-y-4" role="status">
        <span className="sr-only">Loading your trip plans…</span>
        <div className="h-[420px] animate-pulse rounded-[20px] bg-surfaceBright" />
        <div className="h-20 animate-pulse rounded-[16px] bg-surfaceBright" />
      </div>
    );
  }

  if (state.kind === "signedOut") {
    return (
      <div className="rounded-[20px] border border-outline/70 bg-surfaceBright p-6 text-center sm:p-8">
        <h2 className="font-display text-headline-md font-black text-brandInk">Sign in to plan a trip</h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-body-md text-onSurfaceVariant">
          Use the same email, Google or Apple account as the eSim2you app. Plans you make on one show up on the
          other.
        </p>
        <LinkButton className="mt-5" href="/signin?next=%2Ftrip-plan" rel="nofollow" size="lg">
          <LogIn aria-hidden="true" size={18} />
          Sign in to start
        </LinkButton>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-[20px] border border-outline/70 bg-surface p-6 text-center" role="alert">
        <p className="font-semibold text-brandInk">Could not load trip plans.</p>
        <p className="mt-1 text-body-sm text-onSurfaceVariant">{state.message}</p>
        <button
          className="mt-4 min-h-11 rounded-[12px] px-4 font-bold text-brandBlue hover:text-brandInk"
          onClick={() => {
            setState({ kind: "loading" });
            void load();
          }}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  const { config, plans } = state;
  const exhausted = config.remaining <= 0;
  const price = config.price;

  return (
    <div className="space-y-8">
      <div
        className={`rounded-[16px] px-4 py-3 text-body-md ${
          exhausted ? "bg-error/10 text-brandInk" : "bg-brandBlue/10 text-brandInk"
        }`}
        role="status"
      >
        {exhausted ? (
          <>
            <span className="font-bold">Limit reached.</span> You&apos;ve used {config.generationLimit} plans in
            this {config.windowDays}-day window.
            {config.resetsInDays != null ? ` Resets in ${config.resetsInDays} ${config.resetsInDays === 1 ? "day" : "days"}.` : ""}
          </>
        ) : (
          <>
            <span className="font-bold">
              {config.remaining} of {config.generationLimit}
            </span>{" "}
            plans left in this {config.windowDays}-day window. Generating is free;{" "}
            {price.free ? "unlocking is free too." : `unlocking the full plan costs ${formatPlanPrice(price.quoteAmount, price.quoteCurrency)}.`}
          </>
        )}
      </div>

      <TripPlanForm countries={countries} disabled={exhausted} onQuotaChange={() => void load()} />

      <TripPlanList onChanged={() => void load()} plans={plans} windowDays={config.windowDays} />
    </div>
  );
}
