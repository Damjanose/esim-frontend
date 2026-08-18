export type ButtonVariant = "primary" | "flat";
export type ButtonTone = "brand" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ResolveButtonClassesArgs {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  disabled?: boolean;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-[34px] px-2 text-[13px] rounded-[8px]",
  md: "h-[46px] px-4 text-sm rounded-[12px]",
  lg: "h-[54px] px-5 text-[15px] rounded-[12px]"
};

const PRIMARY_CLASSES =
  "bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal text-white " +
  "shadow-[0_14px_34px_rgba(11,73,183,0.28)] hover:-translate-y-0.5";

const FLAT_TONE_CLASSES: Record<ButtonTone, string> = {
  brand: "bg-white text-brandBlue border border-[rgba(11,73,183,0.42)] hover:bg-[rgba(11,73,183,0.06)]",
  danger: "bg-white text-error border border-[rgba(186,26,26,0.38)] hover:bg-[rgba(186,26,26,0.06)]"
};

/**
 * Resolves the Tailwind class string for one button state. Mirrors mobile's
 * `resolveButtonVisual` (velocity-eSim/src/theme/controls.ts): `tone` is only
 * read on `flat` — a primary CTA never turns red.
 */
export function resolveButtonClasses({
  variant = "primary",
  tone = "brand",
  size = "md",
  disabled = false
}: ResolveButtonClassesArgs = {}): string {
  const base =
    "inline-flex items-center justify-center gap-2 font-black transition disabled:cursor-not-allowed disabled:opacity-40";
  const paint = variant === "primary" ? PRIMARY_CLASSES : FLAT_TONE_CLASSES[tone];
  const disabledClasses = disabled ? "pointer-events-none" : "";

  return [base, SIZE_CLASSES[size], paint, disabledClasses].filter(Boolean).join(" ");
}
