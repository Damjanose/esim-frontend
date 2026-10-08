"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Lottie from "lottie-react";
import { Loader2 } from "lucide-react";
import stampAnimation from "@/../public/lottie/stamp.json";
import {
  QUICK_PROMPTS,
  REVIEW_BODY_MAX,
  REVIEW_BODY_MIN,
  REVIEW_DRAFT_KEY,
  REVIEW_NAME_MAX,
  applyPrompt,
  deriveReviewState,
  formatDisplayName,
  parseDraft,
  readErrorKind,
  reviewSignInHref,
  serializeDraft,
  validateReview,
  withReviewOpen,
  type MyReview,
  type ReviewQuota,
  type ReviewState
} from "@/lib/review-composer";
import { Button } from "./Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "./fieldClasses";

type Props = {
  heading: string;
  subheading?: string;
  /** Omit on the homepage: the backend then uses the latest paid order. */
  airaloOrderId?: number;
  /** Order page: render nothing unless the user can write (or just sent). */
  onlyWhenWritable?: boolean;
  onDismiss?: () => void;
};

type Phase = { kind: "loading" } | ReviewState | { kind: "sent" };

function readDraft() {
  try {
    return parseDraft(sessionStorage.getItem(REVIEW_DRAFT_KEY), Date.now());
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(REVIEW_DRAFT_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
}

export function ReviewComposer({ heading, subheading, airaloOrderId, onlyWhenWritable, onDismiss }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const draft = new URLSearchParams(window.location.search).get("review") === "open" ? readDraft() : null;
    if (draft) {
      setRating(draft.rating);
      setBody(draft.body);
      setDisplayName(draft.displayName);
      setConsent(draft.consent);
    }

    let cancelled = false;
    (async () => {
      const response = await fetch("/bff/user/testimonial", { cache: "no-store" }).catch(() => null);
      if (cancelled) return;
      if (!response || response.status === 401) {
        setPhase({ kind: "signed-out" });
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { testimonial: MyReview | null; quota: ReviewQuota };
      };
      setPhase(
        deriveReviewState(
          { signedIn: true, testimonial: payload.data?.testimonial ?? null, quota: payload.data?.quota ?? null },
          new Date()
        )
      );

      if (!draft) {
        const billing = await fetch("/bff/user/billing-address").catch(() => null);
        const address = (await billing?.json().catch(() => ({}))) as {
          data?: { billingAddress?: { holdersName?: string } | null };
        };
        if (!cancelled) setDisplayName((current) => current || formatDisplayName(address?.data?.billingAddress?.holdersName));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function goSignIn() {
    const returnPath = withReviewOpen(`${window.location.pathname}${window.location.search}`);
    try {
      sessionStorage.setItem(
        REVIEW_DRAFT_KEY,
        serializeDraft({ rating, body, displayName, consent, airaloOrderId, returnPath, savedAt: Date.now() })
      );
    } catch {
      // Storage blocked: sign-in still works, the text just isn't restored.
    }
    window.location.assign(reviewSignInHref(returnPath));
  }

  async function send() {
    if (phase.kind === "signed-out") {
      if (rating < 1) {
        setError("Tap the stars to rate your trip.");
        return;
      }
      goSignIn();
      return;
    }

    const invalid = validateReview({ rating, body, displayName });
    if (invalid) {
      setError(invalid);
      return;
    }

    setBusy(true);
    setError(null);
    const response = await fetch("/bff/user/testimonial", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airaloOrderId, rating, body: body.trim(), displayName: displayName.trim(), consentToPublish: consent })
    }).catch(() => null);
    setBusy(false);

    if (response?.ok) {
      clearDraft();
      setPhase({ kind: "sent" });
      return;
    }

    const payload = (await response?.json().catch(() => ({}))) as { error?: string; code?: string } | undefined;
    const kind = readErrorKind(response?.status ?? 502, payload?.code);
    if (kind === "signed-out") return goSignIn();
    if (kind === "invalid") return setError(payload?.error ?? "Please check your review and try again.");
    if (kind === "network") return setError("Couldn't send. Try again.");
    if (kind === "limit-reached") return setPhase({ kind: "limit-reached", resetsAt: null });
    setPhase({ kind });
  }

  if (phase.kind === "loading") {
    // The order-page card stays invisible until it knows it should ask; the
    // homepage dialog is already open, so it needs something in it.
    if (onlyWhenWritable) return null;
    return (
      <div className="grid min-h-40 place-items-center" role="status">
        <Loader2 aria-label="Loading" className="animate-spin text-brandBlue" size={22} />
      </div>
    );
  }
  const writable = phase.kind === "can-write" || phase.kind === "signed-out";
  if (onlyWhenWritable && !writable && phase.kind !== "sent") return null;

  return (
    <section aria-labelledby="review-heading" className="rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-6">
      {phase.kind === "sent" ? (
        <div className="flex items-center gap-4" role="status">
          <div className="h-16 w-16 shrink-0">
            <Lottie animationData={stampAnimation} autoplay={!reduceMotion} loop={false} />
          </div>
          <div>
            <p className="font-display text-lg font-black text-brandInk" id="review-heading">Thanks for sharing!</p>
            <p className="mt-0.5 text-sm text-onSurfaceVariant">It'll appear after a quick check.</p>
          </div>
        </div>
      ) : phase.kind === "already-sent" ? (
        <p className="text-sm text-onSurfaceVariant" id="review-heading">
          Thanks, your review is {phase.status === "approved" ? "live on eSIM2you.com" : "waiting for a quick check"}.
        </p>
      ) : phase.kind === "limit-reached" ? (
        <p className="text-sm text-onSurfaceVariant" id="review-heading">
          You've shared your latest reviews already.
          {phase.resetsAt ? ` You can add another after ${new Date(phase.resetsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.` : ""}
        </p>
      ) : phase.kind === "no-purchase" ? (
        <div id="review-heading">
          <p className="font-bold text-brandInk">Reviews come from verified travelers</p>
          <p className="mt-1 text-sm text-onSurfaceVariant">Pick a plan, travel, then tell us how it went.</p>
          <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-brandBlue" href="/destinations">
            Browse plans
          </Link>
        </div>
      ) : phase.kind === "not-eligible" ? (
        <p className="text-sm text-onSurfaceVariant" id="review-heading">This order can't be reviewed.</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-black text-brandInk" id="review-heading">{heading}</h2>
              {subheading ? <p className="mt-1 text-sm text-onSurfaceVariant">{subheading}</p> : null}
            </div>
            {onDismiss ? (
              <button className="min-h-11 shrink-0 px-2 text-xs font-black text-onSurfaceVariant hover:text-brandInk" onClick={onDismiss} type="button">
                Not now
              </button>
            ) : null}
          </div>

          <div aria-label="Your rating" className="mt-4 flex gap-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                className={`grid h-11 w-11 place-items-center rounded-[10px] transition hover:bg-brandBlue/5 ${value <= rating ? "text-brandBlue" : "text-outline"}`}
                key={value}
                onClick={() => setRating(value)}
                role="radio"
                type="button"
              >
                <svg aria-hidden fill="currentColor" height={28} viewBox="0 0 20 20" width={28}>
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                </svg>
              </button>
            ))}
          </div>

          {rating > 0 ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    className="min-h-9 rounded-full border border-outline px-3 text-xs font-bold text-brandInk transition hover:border-brandBlue hover:text-brandBlue"
                    key={prompt}
                    onClick={() => setBody((current) => applyPrompt(current, prompt))}
                    type="button"
                  >
                    + {prompt}
                  </button>
                ))}
              </div>

              <label className={`${FIELD_LABEL_CLASSES} mt-4`} htmlFor="review-body">Your experience</label>
              <textarea
                className={`${FIELD_INPUT_CLASSES} h-28 resize-none py-3`}
                id="review-body"
                maxLength={REVIEW_BODY_MAX}
                onChange={(event) => setBody(event.target.value)}
                placeholder="How was setup and the connection on your trip?"
                value={body}
              />
              <p className="mt-1 text-right text-[11px] text-onSurfaceVariant">
                {body.trim().length < REVIEW_BODY_MIN ? `${REVIEW_BODY_MIN - body.trim().length} more to go` : `${body.length}/${REVIEW_BODY_MAX}`}
              </p>

              <label className={`${FIELD_LABEL_CLASSES} mt-2`} htmlFor="review-name">Name shown</label>
              <input
                className={FIELD_INPUT_CLASSES}
                id="review-name"
                maxLength={REVIEW_NAME_MAX}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Anna K."
                value={displayName}
              />

              <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-onSurface">
                <input checked={consent} className="h-5 w-5 accent-brandBlue" onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
                Show my review on eSIM2you.com
              </label>
            </>
          ) : null}

          {error ? <p className="mt-3 text-sm font-medium text-error" role="alert">{error}</p> : null}

          {rating > 0 ? (
            <Button autoFocus={phase.kind === "can-write" && body.length > 0} className="mt-4 w-full sm:w-auto" disabled={busy} onClick={send} type="button">
              {busy ? <Loader2 aria-hidden className="animate-spin" size={16} /> : null}
              {phase.kind === "signed-out" ? "Sign in to post" : "Send review"}
            </Button>
          ) : null}

          {phase.kind === "signed-out" ? (
            <p className="mt-3 text-xs text-onSurfaceVariant">For travelers who bought a plan. You'll sign in with Google, Apple or email, and your text is kept.</p>
          ) : null}
        </>
      )}
    </section>
  );
}
