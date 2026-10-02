/**
 * Rules for the traveler's web support chat (/profile/support). They mirror the
 * backend's limits (E-SIM backend src/support/supportValidation.ts and
 * supportUpload.service.ts) so the composer refuses what the API would reject.
 */
export const SUPPORT_MAX_MESSAGE_LENGTH = 4_000;
export const SUPPORT_MAX_ATTACHMENTS = 4;
export const SUPPORT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const SUPPORT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/** How often the open chat re-reads the thread. The browser has no socket token (httpOnly session). */
export const SUPPORT_POLL_MS = 5_000;

export type ComposerCheck = { ok: true; body: string } | { ok: false; message: string };

export function checkSupportComposer(draft: string, files: readonly { size: number }[]): ComposerCheck {
  const body = draft.trim();
  if (!body && files.length === 0) {
    return { ok: false, message: "Write a message or add a photo." };
  }
  if (body.length > SUPPORT_MAX_MESSAGE_LENGTH) {
    return { ok: false, message: `Messages can be up to ${SUPPORT_MAX_MESSAGE_LENGTH} characters.` };
  }
  if (files.length > SUPPORT_MAX_ATTACHMENTS) {
    return { ok: false, message: `You can attach up to ${SUPPORT_MAX_ATTACHMENTS} photos.` };
  }
  if (files.some((file) => file.size > SUPPORT_MAX_IMAGE_BYTES)) {
    return { ok: false, message: "Each photo must be 10 MB or smaller." };
  }
  return { ok: true, body };
}
