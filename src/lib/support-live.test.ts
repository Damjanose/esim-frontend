import { describe, expect, it } from "vitest";
import {
  adminReceiptState,
  applyDeletedSupportMessage,
  applyEditedSupportMessage,
  supportQuoteSnippet,
  supportReplyDragOffset,
  applyMessagePreviewToThreads,
  formatSupportDevice,
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

  it("shows seen only when the traveler read after the admin reply", () => {
    expect(adminReceiptState("2026-10-15T08:00:00Z", null)).toBe("sent");
    expect(adminReceiptState("2026-10-15T08:00:00Z", "2026-10-15T08:05:00Z")).toBe("seen");
    expect(adminReceiptState("2026-10-15T08:10:00Z", "2026-10-15T08:05:00Z")).toBe("sent");
  });

  it("formats the traveler's phone for the admin highlight", () => {
    expect(formatSupportDevice({ deviceModel: "Apple iPhone 15 Pro", deviceOs: "iOS 18.2" })).toBe(
      "Apple iPhone 15 Pro · iOS 18.2"
    );
    expect(formatSupportDevice({ deviceModel: "Google Pixel 8", deviceOs: null })).toBe("Google Pixel 8");
    expect(formatSupportDevice({ deviceModel: null, deviceOs: "iOS 18" })).toBeNull();
    expect(formatSupportDevice({})).toBeNull();
  });
});

describe("support reply helpers", () => {
  const list = [
    { id: "q", body: "Original", attachments: [] },
    { id: "r", body: "Answer", attachments: [], replyTo: { id: "q", body: "Original", hasPhoto: false } }
  ];

  it("refreshes the quote when the quoted message is edited", () => {
    const next = applyEditedSupportMessage(list, { id: "q", body: "Fixed", attachments: [] });
    expect(next[0].body).toBe("Fixed");
    expect(next[1].replyTo?.body).toBe("Fixed");
  });

  it("clears the quote when the quoted message is deleted", () => {
    const next = applyDeletedSupportMessage(list, "q");
    expect(next.map((m) => m.id)).toEqual(["r"]);
    expect(next[0].replyTo).toBeNull();
  });

  it("only drags toward the middle: admin bubbles left, traveler bubbles right", () => {
    expect(supportReplyDragOffset(-30, true)).toBe(-30);
    expect(supportReplyDragOffset(30, true)).toBe(0);
    expect(supportReplyDragOffset(30, false)).toBe(30);
    expect(supportReplyDragOffset(-30, false)).toBe(0);
    expect(supportReplyDragOffset(500, false)).toBe(80);
  });

  it("falls back to Photo for a photo-only quote", () => {
    expect(supportQuoteSnippet({ body: " a\n b ", hasPhoto: false })).toBe("a b");
    expect(supportQuoteSnippet({ body: null, hasPhoto: true })).toBe("Photo");
  });
});
