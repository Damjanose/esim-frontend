import { FIELD_CONTROL_CLASSES } from "../components/fieldClasses";

/** The sign-in card (SignInForm), also the frame for the LinkEmailStep claim screen. */
export const SIGN_IN_CARD_CLASSES =
  "relative w-full max-w-[440px] rounded-[24px] border border-outline/70 bg-surface p-6 shadow-brandCard sm:p-8";

/** Text-style secondary actions (Use a different email, Resend code), at a 44px tap height. */
export const SIGN_IN_TEXT_ACTION_CLASSES =
  "inline-flex min-h-11 items-center px-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

/** The 6-digit code field: the shared control, set large and spaced. */
export const CODE_INPUT_CLASSES = `mt-2 ${FIELD_CONTROL_CLASSES} text-center font-display text-xl font-black tracking-[0.4em]`;
