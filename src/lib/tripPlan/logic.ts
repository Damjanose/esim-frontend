import type { Transport, TripPlanInput } from "./types";

/**
 * Pure trip-plan rules, ported from velocity-eSim's tripPlanFormLogic.ts so the
 * web and the app build the same request and show the same states.
 */

export const DAYS_MIN = 1;
export const DAYS_MAX = 30;
export const PEOPLE_MIN = 1;
export const PEOPLE_MAX = 20;
export const DEFAULT_DAYS = 7;
export const MAX_CHIPS = 10;
/** Latin comma or Arabic comma (U+060C) ends a chip. */
export const CHIP_SEPARATOR = /[,،]/;
/** Mirrors the backend's EDIT_PROMPT_MAX_LENGTH. */
export const EDIT_PROMPT_MAX = 500;

export type TripPlanForm = {
  country: string;
  days: number;
  people: number;
  /** `<input type="date">` value (YYYY-MM-DD) or "". */
  startDate: string;
  transport: Transport | null;
  cities: string[];
  /** Text still in the city input; folded into `cities` on submit. */
  citiesDraft: string;
  mustSee: string[];
  mustSeeDraft: string;
  accommodation: string[];
  accommodationDraft: string;
  notes: string;
  pets: boolean;
};

export const EMPTY_TRIP_PLAN_FORM: TripPlanForm = {
  country: "",
  days: DEFAULT_DAYS,
  people: 1,
  startDate: "",
  transport: null,
  cities: [],
  citiesDraft: "",
  mustSee: [],
  mustSeeDraft: "",
  accommodation: [],
  accommodationDraft: "",
  notes: "",
  pets: false
};

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** YYYY-MM-DD → DD/MM/YYYY, the wire format the itinerary API accepts. "" when not a date. */
export function isoDateToDdMmYyyy(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Today as YYYY-MM-DD in local time, for the date input's `min`. */
export function todayIso(now: Date = new Date()): string {
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/**
 * Adds comma-separated entries from `raw` as chips: trimmed, blanks dropped,
 * case-insensitive duplicates skipped, capped at `max`.
 */
export function addChips(list: string[], raw: string, max = MAX_CHIPS): string[] {
  const next = [...list];
  for (const part of raw.split(CHIP_SEPARATOR)) {
    const value = part.trim();
    if (!value || next.length >= max) continue;
    if (next.some((item) => item.toLowerCase() === value.toLowerCase())) continue;
    next.push(value);
  }
  return next;
}

export function buildTripPlanInput(form: TripPlanForm, lang: string): TripPlanInput {
  const cities = addChips(form.cities, form.citiesDraft);
  const mustSee = addChips(form.mustSee, form.mustSeeDraft).join(", ");
  const accommodation = addChips(form.accommodation, form.accommodationDraft).join(", ");
  const notes = form.notes.trim();
  const startDate = isoDateToDdMmYyyy(form.startDate);
  return {
    country: form.country.trim(),
    durationDays: clampInt(form.days, DAYS_MIN, DAYS_MAX),
    people: clampInt(form.people, PEOPLE_MIN, PEOPLE_MAX),
    lang,
    ...(cities.length ? { cities } : {}),
    ...(mustSee ? { mustSee } : {}),
    ...(notes ? { custom: notes } : {}),
    ...(form.transport ? { transport: form.transport } : {}),
    ...(form.pets ? { pets: true } : {}),
    ...(startDate ? { startDate } : {}),
    ...(accommodation ? { accommodation } : {})
  };
}

/**
 * How many checklist steps to show as done. The last step never ticks — the
 * loader closes when the single create request resolves.
 */
export function generatingStepsDone(elapsedMs: number, stepMs: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.floor(elapsedMs / stepMs), total - 1);
}

/** Which loader subtitle to show: one per ticked stage, then `stages` (the "slow" message) after slowMs. */
export function generatingEtaIndex(elapsedMs: number, stepMs: number, stages: number, slowMs: number): number {
  if (elapsedMs >= slowMs) return stages;
  return generatingStepsDone(elapsedMs, stepMs, stages);
}

export type RefineState =
  | { kind: "hidden" }
  | { kind: "open"; remaining: number; limit: number; editableUntil: Date }
  | { kind: "closed" };

/**
 * What the "Refine this plan" card shows. Hidden when the server sends no edit
 * info or editing is turned off (limit 0); closed once the plan has left the
 * quota window or used its edits.
 */
export function refineState(
  edits: { remaining: number; limit: number; editableUntil: string; canEdit: boolean } | undefined,
  now: Date = new Date()
): RefineState {
  if (!edits || edits.limit <= 0) return { kind: "hidden" };
  const editableUntil = new Date(edits.editableUntil);
  if (!edits.canEdit || edits.remaining <= 0 || !(editableUntil.getTime() > now.getTime())) {
    return { kind: "closed" };
  }
  return { kind: "open", remaining: edits.remaining, limit: edits.limit, editableUntil };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Plans older than the quota window go under "Older plans". The server's
 * `archived` flag wins; without it, fall back to createdAt + windowDays.
 */
export function splitPlansByWindow<T extends { archived?: boolean; createdAt: string }>(
  plans: T[],
  windowDays: number | undefined,
  now: Date = new Date()
): { current: T[]; history: T[] } {
  const current: T[] = [];
  const history: T[] = [];
  for (const plan of plans) {
    let archived = plan.archived;
    if (archived === undefined && windowDays && windowDays > 0) {
      const created = new Date(plan.createdAt).getTime();
      archived = Number.isFinite(created) && created + windowDays * DAY_MS <= now.getTime();
    }
    (archived ? history : current).push(plan);
  }
  return { current, history };
}

export type SummaryCta = "purchase" | "free" | "download";

/** The plan page's main action: pay, claim for free, or (once owned) download. */
export function summaryCta(price: { free: boolean; purchased?: boolean }): SummaryCta {
  if (price.purchased) return "download";
  return price.free ? "free" : "purchase";
}

/** The newest version number, or null when the server sends none. */
export function latestVersion(versions: { n: number }[] | undefined): number | null {
  if (!versions || versions.length === 0) return null;
  return versions.reduce((max, v) => (v.n > max ? v.n : max), versions[0].n);
}

/** "€4.99" style price for the unlock button. */
export function formatPlanPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Version picker label: "Original" for n=0, else "Edit n". */
export function versionLabel(n: number): string {
  return n === 0 ? "Original" : `Edit ${n}`;
}

/* ---- BFF input guards (path segments are interpolated into backend URLs) ---- */

const PLAN_ID = /^[A-Za-z0-9_-]{1,64}$/;
const VERSION = /^\d{1,4}$/;

export function isPlanId(value: unknown): value is string {
  return typeof value === "string" && PLAN_ID.test(value);
}

export function isVersionParam(value: unknown): value is string {
  return typeof value === "string" && VERSION.test(value);
}

/** A trimmed edit prompt, or null when empty or over EDIT_PROMPT_MAX. */
export function readEditPrompt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const prompt = value.trim();
  if (!prompt || prompt.length > EDIT_PROMPT_MAX) return null;
  return prompt;
}
