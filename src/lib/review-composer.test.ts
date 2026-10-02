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
