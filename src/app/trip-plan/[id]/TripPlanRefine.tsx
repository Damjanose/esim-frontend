"use client";

import { useId, useState, type FormEvent } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/app/components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
import { editTripPlan, redirectToSignIn } from "@/lib/tripPlan/client";
import { EDIT_PROMPT_MAX, refineState } from "@/lib/tripPlan/logic";
import type { ItineraryEdits } from "@/lib/tripPlan/types";
import { TripPlanGenerating } from "../TripPlanGenerating";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** "Refine this plan": one prompt rewrites the plan into a new version. */
export function TripPlanRefine({
  planId,
  edits,
  onRefined
}: {
  planId: string;
  edits: ItineraryEdits | undefined;
  onRefined: () => void;
}) {
  const ids = useId();
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = refineState(edits);

  if (state.kind === "hidden") return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || running) return;

    setError(null);
    setRunning(true);
    const result = await editTripPlan(planId, text);
    setRunning(false);

    if (result.ok) {
      setPrompt("");
      onRefined();
      return;
    }
    if (result.status === 401) return redirectToSignIn();
    if (result.status === 0 || result.status >= 500) {
      setError("This took longer than expected. Reload in a minute to see if the new version arrived.");
    } else {
      setError(result.message);
    }
    // Remaining edits may have changed either way.
    onRefined();
  };

  return (
    <section
      aria-labelledby={`${ids}-title`}
      className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:p-7"
    >
      <h2 className="font-display text-headline-md font-black text-brandInk" id={`${ids}-title`}>
        Refine this plan
      </h2>

      {state.kind === "closed" ? (
        <p className="mt-2 text-body-md text-onSurfaceVariant">Editing is closed for this plan.</p>
      ) : (
        <form className="mt-4" onSubmit={submit}>
          <label className={FIELD_LABEL_CLASSES}>
            What should change?
            <textarea
              className={`${FIELD_INPUT_CLASSES} h-auto min-h-28 py-3`}
              disabled={running}
              maxLength={EDIT_PROMPT_MAX}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. Swap the museum on day 2 for a food tour, and start later each morning"
              rows={4}
              value={prompt}
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-body-sm text-onSurfaceVariant">
            <span>
              {state.remaining} of {state.limit} {state.limit === 1 ? "edit" : "edits"} left · until{" "}
              {DATE_FORMAT.format(state.editableUntil)}
            </span>
            <span aria-hidden="true">
              {prompt.length}/{EDIT_PROMPT_MAX}
            </span>
          </div>

          {error ? (
            <p className="mt-3 text-sm font-semibold text-error" role="alert">
              {error}
            </p>
          ) : null}

          <Button className="mt-4" disabled={running || !prompt.trim()} type="submit">
            <Wand2 aria-hidden="true" size={17} />
            Apply changes
          </Button>
        </form>
      )}

      {running ? (
        <TripPlanGenerating
          steps={["Reading your request", "Reworking the days", "Checking times and routes"]}
          title="Updating your plan"
        />
      ) : null}
    </section>
  );
}
