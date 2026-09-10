import { describe, expect, it } from "vitest";
import {
  applyMessagePreviewToThreads,
  nextAdminTypingEmit,
  previewFromSupportMessage,
  shouldAlertAdminOfIncomingMessage,
  supportLiveThreadId,
  supportSocketMessageForThread,
  SUPPORT_TYPING_IDLE_MS
} from "./support-live";

describe("support live inbox helpers", () => {
  const message = {
    id: "m1",
    threadId: "t1",
    body: "Need help with QR",
    createdAt: "2026-09-10T10:00:00.000Z",
    attachments: []
  };

  it("matches a live message on message.threadId when the envelope omits threadId", () => {
    expect(supportSocketMessageForThread({ message }, "t1")?.id).toBe("m1");
  });

  it("matches a live message on payload.threadId", () => {
    expect(supportSocketMessageForThread({ threadId: "t1", message: { id: "m2" } }, "t1")?.id).toBe("m2");
  });

  it("ignores a live message for another conversation", () => {
    expect(supportSocketMessageForThread({ threadId: "other", message }, "t1")).toBeNull();
  });

  it("reads the live thread id from either envelope", () => {
    expect(supportLiveThreadId({ message })).toBe("t1");
    expect(supportLiveThreadId({ threadId: "t9" })).toBe("t9");
    expect(supportLiveThreadId({})).toBeNull();
  });

  it("prefers message text for the conversation preview", () => {
    expect(previewFromSupportMessage({ body: "  hello  " })).toBe("hello");
    expect(previewFromSupportMessage({ body: " ", attachments: [{ id: "a" }] })).toBe("Photo");
  });

  it("updates the matching thread preview and sorts by lastMessageAt", () => {
    const threads = [
      { id: "t1", lastMessageAt: "2026-09-10T09:00:00.000Z", lastMessagePreview: "old" },
      { id: "t2", lastMessageAt: "2026-09-10T09:30:00.000Z", lastMessagePreview: "other" }
    ];
    const next = applyMessagePreviewToThreads(threads, "t1", message);
    expect(next[0]?.id).toBe("t1");
    expect(next[0]?.lastMessagePreview).toBe("Need help with QR");
  });

  it("alerts when a user message arrives for a thread the admin is not looking at", () => {
    expect(
      shouldAlertAdminOfIncomingMessage({
        senderKind: "user",
        threadId: "t1",
        selectedThreadId: "t2",
        pageVisible: true
      })
    ).toBe(true);
    expect(
      shouldAlertAdminOfIncomingMessage({
        senderKind: "user",
        threadId: "t1",
        selectedThreadId: "t1",
        pageVisible: true
      })
    ).toBe(false);
    expect(
      shouldAlertAdminOfIncomingMessage({
        senderKind: "admin",
        threadId: "t1",
        selectedThreadId: null,
        pageVisible: true
      })
    ).toBe(false);
  });

  it("starts typing when the admin begins a draft and stops when it is cleared", () => {
    expect(nextAdminTypingEmit({ hasDraft: true, currentlyEmitting: false })).toBe("start");
    expect(nextAdminTypingEmit({ hasDraft: true, currentlyEmitting: true })).toBeNull();
    expect(nextAdminTypingEmit({ hasDraft: false, currentlyEmitting: true })).toBe("stop");
  });
});
