"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock, Trash2, Unlock } from "lucide-react";
import { deleteTripPlan, redirectToSignIn } from "@/lib/tripPlan/client";
import { splitPlansByWindow } from "@/lib/tripPlan/logic";
import type { ItineraryListItem } from "@/lib/tripPlan/types";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * "Your plans" (current window) and "Older plans" (history). Only history rows
 * can be deleted: the quota counts rows, so the backend refuses to delete a
 * plan that still counts toward it.
 */
export function TripPlanList({
  plans,
  windowDays,
  onChanged
}: {
  plans: ItineraryListItem[];
  windowDays: number | undefined;
  onChanged: () => void;
}) {
  const { current, history } = splitPlansByWindow(plans, windowDays);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    setDeleting(id);
    setError(null);
    const result = await deleteTripPlan(id);
    setDeleting(null);
    setConfirming(null);
    if (!result.ok) {
      if (result.status === 401) return redirectToSignIn();
      setError(result.message || "Could not delete the plan. Try again.");
      return;
    }
    onChanged();
  };

  if (plans.length === 0) {
    return (
      <p className="rounded-[20px] border border-dashed border-outline px-5 py-8 text-center text-body-md text-onSurfaceVariant">
        No plans yet. Your first one will show up here.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {current.length > 0 ? (
        <section aria-labelledby="trip-plans-current">
          <h2 className="font-display text-title-sm font-black text-brandInk" id="trip-plans-current">
            Your plans
          </h2>
          <ul className="mt-3 space-y-2">
            {current.map((plan) => (
              <li key={plan.id}>
                <PlanRow plan={plan} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section aria-labelledby="trip-plans-history">
          <h2 className="font-display text-title-sm font-black text-brandInk" id="trip-plans-history">
            Older plans
          </h2>
          <p className="mt-1 text-body-sm text-onSurfaceVariant">Older plans don&apos;t count toward your limit.</p>
          <ul className="mt-3 space-y-2">
            {history.map((plan) => (
              <li className="flex items-stretch gap-2" key={plan.id}>
                <div className="min-w-0 flex-1">
                  <PlanRow plan={plan} />
                </div>
                {confirming === plan.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      className="min-h-11 rounded-[12px] bg-error px-3 text-sm font-bold text-white disabled:opacity-50"
                      disabled={deleting === plan.id}
                      onClick={() => void remove(plan.id)}
                      type="button"
                    >
                      {deleting === plan.id ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      className="min-h-11 rounded-[12px] px-3 text-sm font-bold text-onSurfaceVariant hover:text-brandInk"
                      onClick={() => setConfirming(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    aria-label={`Delete ${plan.title}`}
                    className="grid w-12 shrink-0 place-items-center rounded-[16px] border border-outline/70 text-onSurfaceVariant transition hover:border-error/40 hover:text-error"
                    onClick={() => setConfirming(plan.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? (
        <p className="text-sm font-semibold text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PlanRow({ plan }: { plan: ItineraryListItem }) {
  const days = plan.summary?.days?.length ?? 0;
  const unlocked = plan.price?.purchased === true;
  const meta = [
    plan.summary?.base,
    days ? (days === 1 ? "1 day" : `${days} days`) : "",
    DATE_FORMAT.format(new Date(plan.createdAt))
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      className="flex min-h-[68px] items-center gap-3 rounded-[16px] border border-outline/70 bg-surface px-4 py-3 transition hover:border-brandBlue/50"
      href={`/trip-plan/${encodeURIComponent(plan.id)}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-brandInk">{plan.title}</p>
        <p className="mt-0.5 truncate text-body-sm text-onSurfaceVariant">{meta}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          unlocked ? "bg-brandTeal/15 text-brandInk" : "bg-surfaceBright text-onSurfaceVariant"
        }`}
      >
        {unlocked ? <Unlock aria-hidden="true" size={12} /> : <Lock aria-hidden="true" size={12} />}
        {unlocked ? "Unlocked" : "Preview"}
      </span>
      <ChevronRight aria-hidden="true" className="shrink-0 text-onSurfaceVariant" size={18} />
    </Link>
  );
}
