"use client";

import { Suspense, useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/app/components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
import { createTripPlan, redirectToSignIn } from "@/lib/tripPlan/client";
import {
  DAYS_MAX,
  DAYS_MIN,
  EMPTY_TRIP_PLAN_FORM,
  MAX_CHIPS,
  PEOPLE_MAX,
  PEOPLE_MIN,
  addChips,
  buildTripPlanInput,
  clampInt,
  todayIso,
  type TripPlanForm as FormState
} from "@/lib/tripPlan/logic";
import type { Transport } from "@/lib/tripPlan/types";
import { TripPlanGenerating } from "./TripPlanGenerating";

const TRANSPORT_OPTIONS: Array<{ value: Transport; label: string }> = [
  { value: "public", label: "Public" },
  { value: "taxi", label: "Taxi" },
  { value: "car", label: "Car" }
];

type ChipField = "cities" | "mustSee" | "accommodation";
type DraftField = "citiesDraft" | "mustSeeDraft" | "accommodationDraft";

/**
 * The create form (the app's TripPlanCreateScreen). Submitting holds one long
 * request open behind the generating overlay, then opens the new plan.
 * `disabled` is set when the quota for this window is used up.
 */
export function TripPlanForm({
  countries,
  disabled,
  onQuotaChange
}: {
  countries: string[];
  disabled: boolean;
  /** Called after a create attempt so the parent can refresh the quota line and the list. */
  onQuotaChange: () => void;
}) {
  const router = useRouter();
  const ids = useId();
  const [form, setForm] = useState<FormState>(EMPTY_TRIP_PLAN_FORM);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = form.country.trim();
  const canSubmit = !disabled && !generating && country.length > 0;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setGenerating(true);
    const result = await createTripPlan(buildTripPlanInput(form, "en"));

    if (result.ok) {
      router.push(`/trip-plan/${encodeURIComponent(result.data.id)}`);
      return;
    }

    setGenerating(false);
    onQuotaChange();
    if (result.status === 401) {
      redirectToSignIn();
      return;
    }
    if (result.status === 429) {
      setError(result.message);
      return;
    }
    if (result.status === 0 || result.status >= 500) {
      setError("This took longer than expected. Your plan may still show up under Your plans in a minute.");
      return;
    }
    setError(result.message);
  };

  return (
    <form
      aria-describedby={error ? `${ids}-error` : undefined}
      className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:p-7"
      noValidate
      onSubmit={submit}
    >
      <h2 className="font-display text-headline-md font-black text-brandInk">New trip plan</h2>
      <Suspense fallback={null}>
        <DestinationFromQuery onDestination={(destination) => set("country", destination)} />
      </Suspense>

      <fieldset className="mt-5 grid gap-5 sm:grid-cols-2" disabled={disabled || generating}>
        <legend className="sr-only">Trip</legend>

        <label className={`${FIELD_LABEL_CLASSES} sm:col-span-2`}>
          Destination
          <input
            autoComplete="off"
            className={FIELD_INPUT_CLASSES}
            list={`${ids}-countries`}
            onChange={(event) => set("country", event.target.value)}
            placeholder="Start typing a country"
            required
            value={form.country}
          />
          <datalist id={`${ids}-countries`}>
            {countries.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>

        <Stepper
          label="Days"
          max={DAYS_MAX}
          min={DAYS_MIN}
          onChange={(value) => set("days", value)}
          value={form.days}
        />
        <Stepper
          label="Travellers"
          max={PEOPLE_MAX}
          min={PEOPLE_MIN}
          onChange={(value) => set("people", value)}
          value={form.people}
        />

        <label className={FIELD_LABEL_CLASSES}>
          Start date <Optional />
          <input
            className={FIELD_INPUT_CLASSES}
            min={todayIso()}
            onChange={(event) => set("startDate", event.target.value)}
            type="date"
            value={form.startDate}
          />
        </label>

        <div>
          <span className={FIELD_LABEL_CLASSES} id={`${ids}-transport`}>
            Getting around <Optional />
          </span>
          <div aria-labelledby={`${ids}-transport`} className="mt-2 grid h-12 grid-cols-3 gap-1 rounded-[12px] border border-outline bg-surfaceBright p-1" role="radiogroup">
            {TRANSPORT_OPTIONS.map((option) => {
              const selected = form.transport === option.value;
              return (
                <button
                  aria-checked={selected}
                  className={`rounded-[9px] text-sm font-bold transition ${
                    selected ? "bg-surface text-brandBlue shadow-sm" : "text-onSurfaceVariant hover:text-brandInk"
                  }`}
                  key={option.value}
                  onClick={() => set("transport", selected ? null : option.value)}
                  role="radio"
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      <details className="group mt-6 border-t border-outline/70 pt-5">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-display text-title-sm font-black text-brandInk">
          Preferences · optional
          <Plus aria-hidden="true" className="transition group-open:rotate-45" size={18} />
        </summary>

        <fieldset className="mt-4 grid gap-5" disabled={disabled || generating}>
          <legend className="sr-only">Preferences</legend>
          <ChipInput
            draft={form.citiesDraft}
            draftKey="citiesDraft"
            itemKey="cities"
            items={form.cities}
            label="Cities"
            placeholder="Add a city, then press Enter"
            setForm={setForm}
          />
          <ChipInput
            draft={form.mustSeeDraft}
            draftKey="mustSeeDraft"
            itemKey="mustSee"
            items={form.mustSee}
            label="Must-see places"
            placeholder="Add a place, then press Enter"
            setForm={setForm}
          />
          <ChipInput
            draft={form.accommodationDraft}
            draftKey="accommodationDraft"
            itemKey="accommodation"
            items={form.accommodation}
            label="Accommodation"
            placeholder="e.g. Hotel in the old town"
            setForm={setForm}
          />
          <label className={FIELD_LABEL_CLASSES}>
            Notes
            <textarea
              className={`${FIELD_INPUT_CLASSES} h-auto min-h-24 py-3`}
              maxLength={1000}
              onChange={(event) => set("notes", event.target.value)}
              placeholder="Anything else for the planner…"
              rows={3}
              value={form.notes}
            />
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-brandInk">
            <input
              checked={form.pets}
              className="h-5 w-5 accent-brandBlue"
              onChange={(event) => set("pets", event.target.checked)}
              type="checkbox"
            />
            Traveling with pets
          </label>
        </fieldset>
      </details>

      {error ? (
        <p className="mt-5 text-sm font-semibold text-error" id={`${ids}-error`} role="alert">
          {error}
        </p>
      ) : null}

      <Button className="mt-6 w-full" disabled={!canSubmit} size="lg" type="submit">
        <Sparkles aria-hidden="true" size={18} />
        {country ? "Generate plan" : "Choose a destination to continue"}
      </Button>

      {generating ? (
        <TripPlanGenerating
          steps={[
            "Choosing your base",
            form.days === 1 ? "Mapping 1 day" : `Mapping ${form.days} days`,
            "Adding must-see places"
          ]}
          title={`Planning ${country}`}
        />
      ) : null}
    </form>
  );
}

/**
 * Prefills the destination from `?destination=` (the AI assistant's "Plan my
 * trip to X"). Re-runs when the query changes, so a second request while already
 * on /trip-plan still lands. Its own Suspense boundary keeps /trip-plan static.
 */
function DestinationFromQuery({ onDestination }: { onDestination: (destination: string) => void }) {
  const destination = useSearchParams().get("destination")?.trim().slice(0, 80) ?? "";
  useEffect(() => {
    if (destination) onDestination(destination);
    // onDestination is a fresh closure each render; only a new query value should prefill.
  }, [destination]);
  return null;
}

function Optional() {
  return <span className="font-medium normal-case tracking-normal text-onSurfaceVariant/70">(optional)</span>;
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const buttonClasses =
    "grid h-12 w-12 shrink-0 place-items-center rounded-[12px] border border-outline text-brandInk transition hover:border-brandBlue/50 hover:text-brandBlue disabled:opacity-40";
  return (
    <div>
      <span className={FIELD_LABEL_CLASSES}>{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <button
          aria-label={`Decrease ${label.toLowerCase()}`}
          className={buttonClasses}
          disabled={value <= min}
          onClick={() => onChange(clampInt(value - 1, min, max))}
          type="button"
        >
          <Minus aria-hidden="true" size={18} />
        </button>
        <input
          aria-label={label}
          className={`${FIELD_INPUT_CLASSES} mt-0 text-center`}
          inputMode="numeric"
          max={max}
          min={min}
          onChange={(event) => onChange(clampInt(Number(event.target.value), min, max))}
          type="number"
          value={value}
        />
        <button
          aria-label={`Increase ${label.toLowerCase()}`}
          className={buttonClasses}
          disabled={value >= max}
          onClick={() => onChange(clampInt(value + 1, min, max))}
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}

function ChipInput({
  label,
  placeholder,
  items,
  draft,
  itemKey,
  draftKey,
  setForm
}: {
  label: string;
  placeholder: string;
  items: string[];
  draft: string;
  itemKey: ChipField;
  draftKey: DraftField;
  setForm: (update: (current: FormState) => FormState) => void;
}) {
  const commit = () =>
    setForm((current) => ({ ...current, [itemKey]: addChips(current[itemKey], current[draftKey]), [draftKey]: "" }));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !draft && items.length > 0) {
      setForm((current) => ({ ...current, [itemKey]: current[itemKey].slice(0, -1) }));
    }
  };

  const full = items.length >= MAX_CHIPS;

  return (
    <div>
      <label className={FIELD_LABEL_CLASSES}>
        {label}
        <input
          className={FIELD_INPUT_CLASSES}
          disabled={full}
          onBlur={commit}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) =>
              /[,،]/.test(value)
                ? { ...current, [itemKey]: addChips(current[itemKey], value), [draftKey]: "" }
                : { ...current, [draftKey]: value }
            );
          }}
          onKeyDown={onKeyDown}
          placeholder={full ? `Up to ${MAX_CHIPS}` : placeholder}
          value={draft}
        />
      </label>
      {items.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item}>
              <button
                aria-label={`Remove ${item}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brandBlue/10 pl-3 pr-2 text-sm font-semibold text-brandBlue transition hover:bg-brandBlue/15"
                onClick={() =>
                  setForm((current) => ({ ...current, [itemKey]: current[itemKey].filter((value) => value !== item) }))
                }
                type="button"
              >
                {item}
                <X aria-hidden="true" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
