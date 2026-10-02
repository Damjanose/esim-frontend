# Web Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signed-in buyers can leave a review on the web from the homepage, the checkout success page and the order page. Signed-out visitors write first and sign in at Send, with their draft kept.

**Architecture:** The backend already has `GET/PUT /user/testimonial`, which needs a JWT and a paid order. This plan adds:
- one BFF route that proxies it;
- one pure logic module (state, draft, validation);
- one client `ReviewComposer` reused by a homepage dialog button and an order-page card;
- a small "reason" note on `/signin`.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind tokens, vitest, `lottie-react`.

**Spec:** `docs/superpowers/specs/2026-10-02-web-reviews-design.md`

**House rules (AGENTS.md):**
- **Never `git commit` without asking the user first.** Every "Commit" step below means: stop, show `git status`, and ask.
- Stay on the current branch.
- Don't run `next build` while the user's dev server is on :3000.

---

## File map

| File | Responsibility |
|---|---|
| Create `src/lib/review-composer.ts` | Pure: limits, `deriveReviewState`, draft (de)serialise, `formatDisplayName`, `validateReview`, `applyPrompt`, `withReviewOpen`, `reviewSignInHref`, `readErrorKind` |
| Create `src/lib/review-composer.test.ts` | Unit tests for the above |
| Create `src/app/bff/user/testimonial/route.ts` | GET/PUT proxy through `callWithSession`, passes the backend `code` through |
| Modify `src/app/bff/user/user-routes.test.ts` | Route tests |
| Create `src/app/components/ReviewComposer.tsx` | Client UI: stars, prompts, text, name, consent, send, states, Lottie thanks |
| Create `src/app/ShareExperienceButton.tsx` | Homepage button plus dialog, lazy-loads the composer, auto-opens on `?review=open` |
| Modify `src/app/Testimonials.tsx` | Render the button; keep the section with 0 quotes; "Verified traveler" label |
| Create `src/app/account/[orderId]/OrderReviewCard.tsx` | Decides when to show the composer on an order page, plus the dismiss logic |
| Modify `src/app/account/[orderId]/page.tsx` | Mount `OrderReviewCard` |
| Modify `src/app/signin/SignInForm.tsx` | `reason=review` note |

---

### Task 1: Pure review logic

**Files:**
- Create: `src/lib/review-composer.ts`
- Test: `src/lib/review-composer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  REVIEW_BODY_MAX,
  applyPrompt,
  deriveReviewState,
  formatDisplayName,
  parseDraft,
  readErrorKind,
  reviewSignInHref,
  serializeDraft,
  validateReview,
  withReviewOpen,
  type ReviewDraft
} from "./review-composer";

const now = new Date("2026-10-02T12:00:00Z");
const quota = (remaining: number, resetsAt: string | null = null) => ({
  limit: 2,
  windowDays: 90,
  remaining,
  resetsAt
});
const review = (status: string, createdAt: string) => ({
  rating: 5,
  body: "Worked the moment I landed.",
  displayName: "Anna K.",
  status,
  createdAt
});

describe("deriveReviewState", () => {
  it("is signed-out without a session", () => {
    expect(deriveReviewState({ signedIn: false, testimonial: null, quota: null }, now)).toEqual({
      kind: "signed-out"
    });
  });

  it("can write with quota left and no recent review", () => {
    expect(deriveReviewState({ signedIn: true, testimonial: null, quota: quota(2) }, now)).toEqual({
      kind: "can-write"
    });
  });

  it("thanks a recent pending or approved review instead of asking again", () => {
    const pending = review("pending", "2026-09-30T00:00:00Z");
    expect(deriveReviewState({ signedIn: true, testimonial: pending, quota: quota(1) }, now)).toEqual({
      kind: "already-sent",
      status: "pending"
    });
    const approved = review("approved", "2026-09-30T00:00:00Z");
    expect(deriveReviewState({ signedIn: true, testimonial: approved, quota: quota(1) }, now)).toEqual({
      kind: "already-sent",
      status: "approved"
    });
  });

  it("lets a review older than the 90-day window be followed by a new one", () => {
    const old = review("approved", "2026-06-01T00:00:00Z");
    expect(deriveReviewState({ signedIn: true, testimonial: old, quota: quota(2) }, now)).toEqual({
      kind: "can-write"
    });
  });

  it("lets a rejected review be replaced while quota remains", () => {
    const rejected = review("rejected", "2026-09-30T00:00:00Z");
    expect(deriveReviewState({ signedIn: true, testimonial: rejected, quota: quota(1) }, now)).toEqual({
      kind: "can-write"
    });
  });

  it("is limit-reached with no quota left", () => {
    const rejected = review("rejected", "2026-09-30T00:00:00Z");
    expect(
      deriveReviewState(
        { signedIn: true, testimonial: rejected, quota: quota(0, "2026-12-01T00:00:00Z") },
        now
      )
    ).toEqual({ kind: "limit-reached", resetsAt: "2026-12-01T00:00:00Z" });
  });
});

describe("draft", () => {
  const draft: ReviewDraft = {
    rating: 4,
    body: "Easy setup, fast data.",
    displayName: "Anna K.",
    consent: true,
    airaloOrderId: 123,
    returnPath: "/account/123?review=open",
    savedAt: now.getTime()
  };

  it("round-trips", () => {
    expect(parseDraft(serializeDraft(draft), now.getTime())).toEqual(draft);
  });

  it("drops drafts older than 24h", () => {
    expect(parseDraft(serializeDraft(draft), now.getTime() + 24 * 60 * 60 * 1000 + 1)).toBeNull();
  });

  it("drops missing or corrupt drafts", () => {
    expect(parseDraft(null, now.getTime())).toBeNull();
    expect(parseDraft("{not json", now.getTime())).toBeNull();
    expect(parseDraft(JSON.stringify({ rating: "5" }), now.getTime())).toBeNull();
  });
});

describe("formatDisplayName", () => {
  it("shortens to first name plus last initial", () => {
    expect(formatDisplayName("anna karenina")).toBe("Anna K.");
    expect(formatDisplayName("  Jean  Luc  Picard ")).toBe("Jean P.");
    expect(formatDisplayName("Anna")).toBe("Anna");
    expect(formatDisplayName("")).toBe("");
    expect(formatDisplayName(null)).toBe("");
  });
});

describe("validateReview", () => {
  const ok = { rating: 5, body: "Worked straight away.", displayName: "Anna K." };
  it("accepts a valid review", () => {
    expect(validateReview(ok)).toBeNull();
  });
  it("rejects bad input with a user-facing message", () => {
    expect(validateReview({ ...ok, rating: 0 })).toMatch(/stars/i);
    expect(validateReview({ ...ok, body: "short" })).toMatch(/10/);
    expect(validateReview({ ...ok, body: "x".repeat(REVIEW_BODY_MAX + 1) })).toMatch(/500/);
    expect(validateReview({ ...ok, displayName: " " })).toMatch(/name/i);
  });
});

describe("applyPrompt", () => {
  it("adds the prompt as a sentence", () => {
    expect(applyPrompt("", "Easy setup")).toBe("Easy setup.");
    expect(applyPrompt("Loved it.", "Fast data")).toBe("Loved it. Fast data.");
  });
  it("never exceeds the max length", () => {
    expect(applyPrompt("x".repeat(REVIEW_BODY_MAX), "Fast data")).toHaveLength(REVIEW_BODY_MAX);
  });
});

describe("links", () => {
  it("adds review=open once, keeping other params", () => {
    expect(withReviewOpen("/")).toBe("/?review=open");
    expect(withReviewOpen("/account/9?new=1")).toBe("/account/9?new=1&review=open");
    expect(withReviewOpen("/?review=open")).toBe("/?review=open");
  });
  it("builds the sign-in link with a reason and an encoded next", () => {
    expect(reviewSignInHref("/?review=open")).toBe("/signin?reason=review&next=%2F%3Freview%3Dopen");
  });
});

describe("readErrorKind", () => {
  it("maps backend codes and statuses to UI states", () => {
    expect(readErrorKind(401, undefined)).toBe("signed-out");
    expect(readErrorKind(400, "TESTIMONIAL_NO_PURCHASE")).toBe("no-purchase");
    expect(readErrorKind(429, "TESTIMONIAL_LIMIT")).toBe("limit-reached");
    expect(readErrorKind(400, "TESTIMONIAL_INVALID")).toBe("invalid");
    expect(readErrorKind(404, "TESTIMONIAL_ORDER_NOT_FOUND")).toBe("not-eligible");
    expect(readErrorKind(400, "TESTIMONIAL_ORDER_NOT_OWNED")).toBe("not-eligible");
    expect(readErrorKind(400, "TESTIMONIAL_ORDER_UNPAID")).toBe("not-eligible");
    expect(readErrorKind(502, undefined)).toBe("network");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm exec vitest run src/lib/review-composer.test.ts`
Expected: FAIL, "Failed to resolve import ./review-composer"

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm exec vitest run src/lib/review-composer.test.ts`
Expected: PASS, all green

- [ ] **Step 5: Commit**: ask the user first. Suggested message: `feat(reviews): pure composer logic`

---

### Task 2: BFF route `/bff/user/testimonial`

**Files:**
- Create: `src/app/bff/user/testimonial/route.ts`
- Modify: `src/app/bff/user/user-routes.test.ts` (import at the top, new `describe` blocks at the end)

- [ ] **Step 1: Write the failing tests** (append; add the import next to the others)

```ts
import { GET as getTestimonial, PUT as putTestimonial } from "./testimonial/route";

describe("GET /bff/user/testimonial", () => {
  it("returns the latest review and quota", async () => {
    const data = { testimonial: null, quota: { limit: 2, windowDays: 90, remaining: 2, resetsAt: null } };
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "success", data })));

    const response = await getTestimonial(
      new Request("http://localhost:3000/bff/user/testimonial", { headers: { cookie: signedIn } })
    );
    const payload = (await response.json()) as { data: unknown };

    expect(response.status).toBe(200);
    expect(payload.data).toEqual(data);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("is 401 without a session, without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await getTestimonial(new Request("http://localhost:3000/bff/user/testimonial"));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("PUT /bff/user/testimonial", () => {
  const body = {
    airaloOrderId: 123,
    rating: 5,
    body: "Worked the moment I landed.",
    displayName: "Anna K.",
    consentToPublish: true
  };
  function putRequest(value: unknown) {
    return new Request("http://localhost:3000/bff/user/testimonial", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: signedIn },
      body: JSON.stringify(value)
    });
  }

  it("forwards the review with web locale and platform", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: { testimonial: {}, quota: {} } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await putTestimonial(putRequest(body));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/user/testimonial");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ ...body, locale: "en", platform: "web" });
  });

  it("passes the backend error code through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          { status: "error", message: "You can share a testimonial after a purchase", code: "TESTIMONIAL_NO_PURCHASE" },
          400
        )
      )
    );

    const response = await putTestimonial(putRequest({ ...body, airaloOrderId: undefined }));
    const payload = (await response.json()) as { error: string; code: string };

    expect(response.status).toBe(400);
    expect(payload.code).toBe("TESTIMONIAL_NO_PURCHASE");
  });

  it("rejects a non-object body before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await putTestimonial(putRequest("nope"));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm exec vitest run src/app/bff/user/user-routes.test.ts`
Expected: FAIL, cannot resolve `./testimonial/route`

- [ ] **Step 3: Implement** `src/app/bff/user/testimonial/route.ts`

```ts
import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/**
 * The signed-in user's review (testimonial) and send quota. The backend owns
 * every rule (paid order, 2 per 90 days, lengths); this only proxies, and
 * passes its error `code` through so the composer can pick the right state.
 */
function noStore<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ testimonial: unknown; quota: unknown }>("/user/testimonial", { token })
  );

  if (!attempt.ok) {
    return noStore(errorJson(attempt.message, attempt.status, { code: attempt.code }, attempt.cookies));
  }

  return noStore(successJson(attempt.data, attempt.cookies));
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson("Invalid request body", 400);
  }

  if (!body || typeof body !== "object") {
    return errorJson("Invalid request body", 400);
  }

  const input = body as Record<string, unknown>;

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ testimonial: unknown; quota: unknown }>("/user/testimonial", {
      method: "PUT",
      body: {
        airaloOrderId: input.airaloOrderId,
        rating: input.rating,
        body: input.body,
        displayName: input.displayName,
        consentToPublish: input.consentToPublish === true,
        locale: "en",
        platform: "web"
      },
      token
    })
  );

  if (!attempt.ok) {
    return noStore(errorJson(attempt.message, attempt.status, { code: attempt.code }, attempt.cookies));
  }

  return noStore(successJson(attempt.data, attempt.cookies));
}
```

Note: `JSON.stringify` drops `airaloOrderId: undefined`, which is what the "pass the code through" test sends. Check how `errorCode()` in `src/lib/with-session.ts` reads `payload.code`. If `backendFetch` doesn't keep `code` in `payload` for this response shape, fix it there rather than in the route.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm exec vitest run src/app/bff/user/user-routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**: ask the user first. Suggested message: `feat(reviews): BFF route for the user's testimonial`

---

### Task 3: `ReviewComposer` client component

**Files:**
- Create: `src/app/components/ReviewComposer.tsx`

No unit test: the logic lives in Task 1. Verify with `tsc` here and in the browser in Task 7.

- [ ] **Step 1: Implement**

```tsx
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

  if (phase.kind === "loading") return null;
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
          Thanks, your review is {phase.status === "approved" ? "live on eSim2you.com" : "waiting for a quick check"}.
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
                Show my review on eSim2you.com
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
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. If `Button` doesn't accept `autoFocus` or `onClick`, check its `ButtonProps` (`src/app/components/Button.tsx:15`). It spreads `...rest` onto `<button>`, so they should pass through. If the JSON import of `stamp.json` errors, copy the exact import style from `src/app/checkout/steps/CardStep.tsx:18`.

- [ ] **Step 3: Run the colour guard tests**

Run: `pnpm exec vitest run src/app/components`
Expected: PASS. No raw hex and no retired tokens (`retiredTokens.ts`).

- [ ] **Step 4: Commit**: ask the user first. Suggested message: `feat(reviews): ReviewComposer`

---

### Task 4: Homepage button + Testimonials changes

**Files:**
- Create: `src/app/ShareExperienceButton.tsx`
- Modify: `src/app/Testimonials.tsx`
- Modify: `src/app/homepage-blocks.test.ts` (add one assertion)

`Testimonials.tsx` must keep passing `expect(testimonials).not.toContain("Review")` (f191). Don't import `ReviewComposer` there directly.

- [ ] **Step 1: Write the failing assertion** (inside the existing "makes the testimonials a scroll-snap carousel…" `it`, or a new `it` in the same `describe`)

```ts
  it("lets travelers share their experience and labels quotes as verified", () => {
    expect(testimonials).toContain("<ShareExperienceButton");
    expect(testimonials).toContain("Verified traveler");
    // Section stays (header + button) with zero approved quotes.
    expect(testimonials).not.toContain("if (items.length === 0) return null;");
  });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm exec vitest run src/app/homepage-blocks.test.ts`
Expected: FAIL on `<ShareExperienceButton`

- [ ] **Step 3: Create `src/app/ShareExperienceButton.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "./components/Button";

// Loaded on first open so the homepage ships none of the composer (CWV budget).
const ReviewComposer = dynamic(() => import("./components/ReviewComposer").then((mod) => mod.ReviewComposer), {
  ssr: false
});

export function ShareExperienceButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Back from sign-in with a saved draft.
    if (new URLSearchParams(window.location.search).get("review") === "open") setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant="flat">
        Share your experience
      </Button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-brandInk/40 p-0 sm:items-center sm:p-6"
          onClick={(event) => event.target === event.currentTarget && setOpen(false)}
          role="dialog"
        >
          <div className="relative max-h-[92svh] w-full overflow-y-auto rounded-t-[24px] bg-surface p-1 sm:max-w-lg sm:rounded-[24px]">
            <button
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-onSurfaceVariant hover:bg-surfaceBright"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden size={18} />
            </button>
            <ReviewComposer heading="How was your trip?" subheading="Your review helps other travelers pick a plan." />
          </div>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Edit `src/app/Testimonials.tsx`**

Replace the top of the component (keep the empty case) and the heading block:

```tsx
import type { PublicTestimonial } from "@/lib/testimonials";
import { ShareExperienceButton } from "./ShareExperienceButton";

export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  const featured = items.length === 1;

  return (
    <section className="relative overflow-hidden bg-surface px-5 py-10 text-onSurface md:px-8 md:py-24" id="testimonials">
      <div className="relative mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-brandInk [text-wrap:balance] sm:text-4xl">
            What travelers say
          </h2>
          <ShareExperienceButton />
        </div>

        {items.length === 0 ? (
          <p className="mt-4 max-w-xl text-onSurfaceVariant">Bought a plan? Tell other travelers how it went.</p>
        ) : featured ? (
```

…and the rest of the existing JSX is unchanged. In `Author`, change the subline:

```tsx
          Verified traveler{date ? ` · ${date}` : ""}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `pnpm exec vitest run src/app/homepage-blocks.test.ts src/app/core-web-vitals.test.ts src/lib/seo.test.ts`
Expected: PASS. If `core-web-vitals.test.ts` flags a new client import on the homepage, it should accept `next/dynamic`. Read the failing assertion before changing anything.

- [ ] **Step 6: Commit**: ask the user first. Suggested message: `feat(reviews): share-your-experience on the homepage`

---

### Task 5: Order page card (checkout success + later visits)

**Files:**
- Create: `src/app/account/[orderId]/OrderReviewCard.tsx`
- Modify: `src/app/account/[orderId]/page.tsx` (import, plus mount after the `isToppedUp` banner block around line 210)

- [ ] **Step 1: Create `OrderReviewCard.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ReviewComposer } from "../../components/ReviewComposer";

/**
 * Asks for a review at the two high-intent moments on an order: right after
 * payment (`?new=1`) and once the eSIM is in use. "Not now" hides it for this
 * order only; the homepage button still works.
 */
export function OrderReviewCard({
  airaloOrderId,
  justPaid,
  lifecycle
}: {
  airaloOrderId: number;
  justPaid: boolean;
  lifecycle: "ready" | "active" | "expired";
}) {
  const key = `review_dismissed_${airaloOrderId}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(key) === "1";
    } catch {
      // Storage blocked: just show it.
    }
    const reopened = new URLSearchParams(window.location.search).get("review") === "open";
    setShow(reopened || (!dismissed && (justPaid || lifecycle !== "ready")));
  }, [key, justPaid, lifecycle]);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // Storage blocked: hide for this visit only.
    }
    setShow(false);
  }

  return (
    <div className="mt-4">
      <ReviewComposer
        airaloOrderId={airaloOrderId}
        heading={justPaid && lifecycle === "ready" ? "How was buying your eSIM?" : "How's your trip data?"}
        onDismiss={dismiss}
        onlyWhenWritable
        subheading="Two taps and a line. It helps other travelers a lot."
      />
    </div>
  );
}
```

- [ ] **Step 2: Mount it in `page.tsx`**

Import:

```tsx
import { OrderReviewCard } from "./OrderReviewCard";
```

After the closing `) : null}` of the `isToppedUp === "1"` block:

```tsx
          <OrderReviewCard
            airaloOrderId={order.id}
            justPaid={isNew === "1"}
            lifecycle={order.lifecycle_status}
          />
```

- [ ] **Step 3: Type-check and run the account tests**

Run: `pnpm exec tsc --noEmit && pnpm exec vitest run src/app/account src/app/components/usage-cards.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**: ask the user first. Suggested message: `feat(reviews): ask for a review on the order page`

---

### Task 6: Sign-in "reason" note

**Files:**
- Modify: `src/app/signin/SignInForm.tsx` (next to `isCheckout`, about line 36, and in the email-step JSX above `<SocialSignInButtons`)

- [ ] **Step 1: Add the flag** under `const isCheckout = …`:

```tsx
  const isReview = searchParams.get("reason") === "review";
```

- [ ] **Step 2: Render the note** directly above the `<SocialSignInButtons next={next} … />` line (around line 152):

```tsx
        {isReview ? (
          <p className="mb-4 rounded-[12px] bg-brandBlue/5 px-4 py-3 text-sm font-medium text-brandInk" role="status">
            Sign in to post your review. Your text is saved.
          </p>
        ) : null}
```

- [ ] **Step 3: Check `next` survives every sign-in path**

Run: `grep -n "next" src/app/signin/SocialSignInButtons.tsx src/app/signin/LinkEmailStep.tsx`
Expected: both receive and use `next`. The OTP path already does `router.replace(next)`.

- [ ] **Step 4: Type-check and run the sign-in tests**

Run: `pnpm exec tsc --noEmit && pnpm exec vitest run src/app/signin src/lib/safe-redirect`
Expected: PASS

- [ ] **Step 5: Commit**: ask the user first. Suggested message: `feat(reviews): sign-in explains the review handoff`

---

### Task 7: End-to-end check, then docs

- [ ] **Step 1: Full test and type run**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: all green

- [ ] **Step 2: Manual check in the browser** (dev server on :3000, local backend on :4000; check :3000 is free or reuse the user's server, and never `next build` over it)

1. Signed out: open the homepage, click "Share your experience", pick 5 stars, add the "Easy setup" prompt, type a sentence, then click "Sign in to post". `/signin?reason=review&next=%2F%3Freview%3Dopen` should show the note.
2. Sign in with email OTP. You should land on `/?review=open`, the dialog opens with the stars and text restored, and you click "Send review". The stamp animation and the "Thanks" message appear.
3. `/xtestimonialsy` shows the row as `pending`. Approve it, and the homepage shows it with "Verified traveler".
4. Make a purchase, or open an existing order with `?new=1`: no card, because a recent review exists, which is expected. Delete that testimonial row (or use a fresh account with a paid order). The card shows "How was buying your eSIM?"; "Not now" hides it and survives a reload.
5. A signed-in account with no paid order sends from the homepage and sees "Reviews come from verified travelers".
6. Check at 320px width that there's no horizontal scroll, the dialog becomes a bottom sheet, and the stars are ≥44px.

- [ ] **Step 3: Review your own diff** (`git diff`) as if it were someone else's PR.

- [ ] **Step 4: feedAI + session docs** (per `feedAI/MAINTAIN.md`)
- Append a `facts.jsonl` fact (kind `feature`, topic `public-content-pages`): web review submission via `/bff/user/testimonial`, write-first draft handoff (`esim2you_review_draft`, `?review=open`, `/signin?reason=review`), the three entry points, and "Testimonials.tsx must stay free of the string 'Review' (f191), so the button is `ShareExperienceButton`".
- Add an entry to `feedAI/topics/public-content-pages.json`.
- Write `docs/sessions/2026-10-02_web-reviews.md`, add an INDEX row, and bump `brain.json` `sync`.

- [ ] **Step 5: Commit**: ask the user first.
