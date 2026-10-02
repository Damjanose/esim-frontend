/**
 * Pure logic behind the web review composer. The rules mirror the backend's
 * testimonial service (E-SIM backend/src/services/testimonial.service.ts), which
 * stays the source of truth: these checks only save a round trip.
 */

export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 500;
export const REVIEW_NAME_MAX = 40;
const WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export const REVIEW_DRAFT_KEY = "esim2you_review_draft";
export const QUICK_PROMPTS = ["Easy setup", "Fast data", "Great price", "Helpful support"] as const;

export type ReviewQuota = {
  limit: number;
  windowDays: number;
  remaining: number;
  resetsAt: string | null;
};

export type MyReview = {
  rating: number;
  body: string;
  displayName: string;
  status: string;
  createdAt: string;
};

export type ReviewState =
  | { kind: "signed-out" }
  | { kind: "can-write" }
  | { kind: "already-sent"; status: "pending" | "approved" }
  | { kind: "limit-reached"; resetsAt: string | null }
  | { kind: "no-purchase" }
  | { kind: "not-eligible" };

export function deriveReviewState(
  input: { signedIn: boolean; testimonial: MyReview | null; quota: ReviewQuota | null },
  now: Date
): ReviewState {
  if (!input.signedIn) return { kind: "signed-out" };

  const latest = input.testimonial;
  if (latest && (latest.status === "pending" || latest.status === "approved")) {
    const sentAt = new Date(latest.createdAt).getTime();
    if (Number.isFinite(sentAt) && now.getTime() - sentAt < WINDOW_MS) {
      return { kind: "already-sent", status: latest.status };
    }
  }

  if (input.quota && input.quota.remaining <= 0) {
    return { kind: "limit-reached", resetsAt: input.quota.resetsAt };
  }

  return { kind: "can-write" };
}

export type ReviewDraft = {
  rating: number;
  body: string;
  displayName: string;
  consent: boolean;
  airaloOrderId?: number;
  returnPath: string;
  savedAt: number;
};

export function serializeDraft(draft: ReviewDraft): string {
  return JSON.stringify(draft);
}

export function parseDraft(raw: string | null, now: number): ReviewDraft | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<ReviewDraft>;
  if (
    typeof draft.rating !== "number" ||
    typeof draft.body !== "string" ||
    typeof draft.displayName !== "string" ||
    typeof draft.consent !== "boolean" ||
    typeof draft.returnPath !== "string" ||
    typeof draft.savedAt !== "number"
  ) {
    return null;
  }
  if (now - draft.savedAt > DRAFT_TTL_MS) return null;
  return {
    rating: draft.rating,
    body: draft.body,
    displayName: draft.displayName,
    consent: draft.consent,
    ...(typeof draft.airaloOrderId === "number" ? { airaloOrderId: draft.airaloOrderId } : {}),
    returnPath: draft.returnPath,
    savedAt: draft.savedAt
  };
}

/** "anna karenina" → "Anna K.": friendly but not a full name on a public page. */
export function formatDisplayName(fullName: string | null | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  const first = capital(parts[0]);
  const name = parts.length > 1 ? `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : first;
  return name.slice(0, REVIEW_NAME_MAX);
}

export function validateReview(input: { rating: number; body: string; displayName: string }): string | null {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return "Tap the stars to rate your trip.";
  }
  const body = input.body.trim();
  if (body.length < REVIEW_BODY_MIN) return `Write at least ${REVIEW_BODY_MIN} characters.`;
  if (body.length > REVIEW_BODY_MAX) return `Keep it under ${REVIEW_BODY_MAX} characters.`;
  const name = input.displayName.trim();
  if (name.length < 1 || name.length > REVIEW_NAME_MAX) return "Add the name to show with your review.";
  return null;
}

export function applyPrompt(body: string, prompt: string): string {
  const trimmed = body.trim();
  const next = `${trimmed}${trimmed ? " " : ""}${prompt}.`;
  return next.slice(0, REVIEW_BODY_MAX);
}

export function withReviewOpen(path: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("review", "open");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function reviewSignInHref(returnPath: string): string {
  return `/signin?reason=review&next=${encodeURIComponent(returnPath)}`;
}

export type ReviewErrorKind = "signed-out" | "no-purchase" | "limit-reached" | "invalid" | "not-eligible" | "network";

export function readErrorKind(status: number, code: string | undefined): ReviewErrorKind {
  if (status === 401) return "signed-out";
  if (code === "TESTIMONIAL_NO_PURCHASE") return "no-purchase";
  if (status === 429 || code === "TESTIMONIAL_LIMIT") return "limit-reached";
  if (code === "TESTIMONIAL_INVALID") return "invalid";
  if (code?.startsWith("TESTIMONIAL_ORDER_")) return "not-eligible";
  return "network";
}
