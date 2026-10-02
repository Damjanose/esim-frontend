"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { CONTENT_TEXT_LINK } from "@/app/components/contentClasses";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
import { fetchTripPlan, fetchTripPlanVersion, redirectToSignIn, tripPlanPdfUrl } from "@/lib/tripPlan/client";
import { toDocView } from "@/lib/tripPlan/docView";
import { latestVersion, versionLabel } from "@/lib/tripPlan/logic";
import type { ItineraryListItem, PlanDocument } from "@/lib/tripPlan/types";
import { TripPlanDocument } from "../TripPlanDocument";
import { TripPlanRefine } from "./TripPlanRefine";
import { TripPlanUnlock } from "./TripPlanUnlock";

type CountryOption = { code: string; name: string };

type State =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "error"; message: string }
  | { kind: "ready"; plan: ItineraryListItem };

/**
 * One plan (the app's TripPlanSummaryScreen): the locked preview with the unlock
 * panel, or the full plan with versions, PDF download and refine.
 */
export function TripPlanDetail({
  planId,
  accountEmail,
  countries
}: {
  planId: string;
  accountEmail: string | null;
  countries: CountryOption[];
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  /** null = the latest version, whose document comes with the plan itself. */
  const [selected, setSelected] = useState<number | null>(null);
  const [versionDoc, setVersionDoc] = useState<{ n: number; document: PlanDocument } | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchTripPlan(planId);
    if (result.ok) {
      setState({ kind: "ready", plan: result.data });
      setSelected(null);
      setVersionDoc(null);
      return;
    }
    if (result.status === 401) return redirectToSignIn();
    setState(result.status === 404 ? { kind: "notFound" } : { kind: "error", message: result.message });
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const plan = state.kind === "ready" ? state.plan : null;
  const latest = latestVersion(plan?.versions);

  useEffect(() => {
    if (selected === null || selected === latest) return;
    let cancelled = false;
    setVersionError(null);
    void fetchTripPlanVersion(planId, selected).then((result) => {
      if (cancelled) return;
      if (result.ok) setVersionDoc({ n: selected, document: result.data.document });
      else setVersionError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [planId, selected, latest]);

  const shownVersion = selected ?? latest;
  const shownDoc =
    selected !== null && selected !== latest
      ? versionDoc?.n === selected
        ? versionDoc.document
        : null
      : plan?.document ?? null;
  const view = useMemo(() => (shownDoc ? toDocView(shownDoc) : null), [shownDoc]);

  if (state.kind === "loading") {
    return (
      <div aria-busy="true" className="space-y-4" role="status">
        <span className="sr-only">Loading your plan…</span>
        <div className="h-10 w-2/3 animate-pulse rounded-[12px] bg-surfaceBright" />
        <div className="h-[520px] animate-pulse rounded-[20px] bg-surfaceBright" />
      </div>
    );
  }

  if (state.kind === "notFound" || state.kind === "error") {
    return (
      <div className="rounded-[20px] border border-outline/70 bg-surface p-6 text-center" role="alert">
        <p className="font-display text-headline-md font-black text-brandInk">
          {state.kind === "notFound" ? "Plan not found" : "Could not load this plan"}
        </p>
        <p className="mt-1 text-body-md text-onSurfaceVariant">
          {state.kind === "notFound"
            ? "It may have been deleted, or it belongs to another account."
            : state.message}
        </p>
        <LinkButton className="mt-5" href="/trip-plan" variant="flat">
          Back to your plans
        </LinkButton>
      </div>
    );
  }

  const { plan: ready } = state;
  const purchased = ready.price?.purchased === true;
  const versions = ready.versions ?? [];

  return (
    <div className="space-y-6">
      <a className={CONTENT_TEXT_LINK} href="/trip-plan">
        <ArrowLeft aria-hidden="true" size={18} />
        All trip plans
      </a>

      {purchased ? (
        <div className="flex flex-col gap-3 rounded-[20px] border border-outline/70 bg-surfaceBright p-4 sm:flex-row sm:items-end sm:justify-between">
          {versions.length > 1 ? (
            <label className={`${FIELD_LABEL_CLASSES} sm:w-72`}>
              Version
              <select
                className={FIELD_INPUT_CLASSES}
                onChange={(event) => setSelected(Number(event.target.value))}
                value={shownVersion ?? 0}
              >
                {[...versions].reverse().map((version) => (
                  <option key={version.n} value={version.n}>
                    {versionLabel(version.n)}
                    {version.n === latest ? " (latest)" : ""}
                    {version.prompt ? ` · ${truncate(version.prompt, 48)}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-body-md font-semibold text-brandInk">Your plan is unlocked.</p>
          )}
          <LinkButton download href={tripPlanPdfUrl(ready.id, shownVersion)} size="md">
            <Download aria-hidden="true" size={17} />
            Download PDF
          </LinkButton>
        </div>
      ) : null}

      {versionError ? (
        <p className="text-sm font-semibold text-error" role="alert">
          {versionError}
        </p>
      ) : null}

      {view ? (
        <TripPlanDocument view={view} />
      ) : (
        <div aria-busy="true" className="h-[520px] animate-pulse rounded-[20px] bg-surfaceBright" role="status">
          <span className="sr-only">Loading this version…</span>
        </div>
      )}

      {purchased ? (
        <TripPlanRefine edits={ready.edits} onRefined={() => void load()} planId={ready.id} />
      ) : (
        <TripPlanUnlock
          accountEmail={accountEmail}
          countries={countries}
          onUnlocked={() => void load()}
          planId={ready.id}
          price={ready.price}
        />
      )}
    </div>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
