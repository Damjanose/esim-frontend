/**
 * Shared form-control look for checkout and sign-in (phase 5 of the mobile-parity
 * redesign): 48px tall, white on the page, brandBlue border + soft ring on focus.
 * Tokens only. Text is 16px below sm so iOS Safari doesn't zoom into a focused field.
 */
export const FIELD_LABEL_CLASSES = "block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant";

/** Box, border and focus ring, without text size or margin (the code and promo inputs set their own). */
export const FIELD_CONTROL_CLASSES =
  "h-12 w-full rounded-[12px] border border-outline bg-surface px-4 text-brandInk outline-none transition " +
  "placeholder:text-onSurfaceVariant/60 focus:border-brandBlue focus:ring-4 focus:ring-brandBlue/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const FIELD_TEXT_CLASSES = "text-base font-medium sm:text-sm";

/** A labelled text input or select: the label above, 8px gap. */
export const FIELD_INPUT_CLASSES = `mt-2 ${FIELD_CONTROL_CLASSES} ${FIELD_TEXT_CLASSES}`;

export const FIELD_ERROR_CLASSES = "mt-1 block text-[11px] font-medium normal-case tracking-normal text-error";
