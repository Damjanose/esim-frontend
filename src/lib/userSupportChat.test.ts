import { describe, expect, it } from "vitest";
import {
  SUPPORT_MAX_ATTACHMENTS,
  SUPPORT_MAX_IMAGE_BYTES,
  SUPPORT_MAX_MESSAGE_LENGTH,
  checkSupportComposer
} from "./userSupportChat";

describe("checkSupportComposer", () => {
  it("rejects an empty message without photos", () => {
    expect(checkSupportComposer("   ", [])).toEqual({ ok: false, message: "Write a message or add a photo." });
  });

  it("accepts a photo-only message and trims text", () => {
    expect(checkSupportComposer("  ", [{ size: 10 }])).toEqual({ ok: true, body: "" });
    expect(checkSupportComposer("  hi \n", [])).toEqual({ ok: true, body: "hi" });
  });

  it("enforces the backend limits", () => {
    expect(checkSupportComposer("x".repeat(SUPPORT_MAX_MESSAGE_LENGTH + 1), []).ok).toBe(false);
    expect(checkSupportComposer("hi", Array.from({ length: SUPPORT_MAX_ATTACHMENTS + 1 }, () => ({ size: 1 }))).ok).toBe(false);
    expect(checkSupportComposer("hi", [{ size: SUPPORT_MAX_IMAGE_BYTES + 1 }]).ok).toBe(false);
  });
});
