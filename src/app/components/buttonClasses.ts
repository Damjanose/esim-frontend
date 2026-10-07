export type ButtonVariant = "lit" | "tint" | "ghost";
export type ButtonTone = "brand" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonSurface = "light" | "dark";

export interface ResolveButtonClassesArgs {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  surface?: ButtonSurface;
  /** The app icon's orbit dot on the right edge. One per page: the main buy/continue. */
  hero?: boolean;
  disabled?: boolean;
}

/** Full pills at the mobile control heights (34 / 46 / 54). */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-[34px] px-3 text-[13px]",
  md: "h-[46px] px-4 text-sm",
  lg: "h-[54px] px-5 text-[15px]"
};

const BASE =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold " +
  "transition-[transform,box-shadow,background-color] duration-100 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandTeal focus-visible:ring-offset-2";

/**
 * Lit = solid colour lit from above with a lip and a glow, sinking 2px into the
 * lip while pressed. Reduced motion swaps the sink for an opacity dip.
 */
const LIT_MOTION =
  "hover:brightness-[1.04] active:translate-y-[2px] motion-reduce:transition-none " +
  "motion-reduce:active:translate-y-0 motion-reduce:active:opacity-85";

const LIT = {
  brand: "bg-gradient-to-b from-litTop to-brandBlue text-white",
  danger: "bg-gradient-to-b from-dangerTop to-error text-white",
  moon: "bg-gradient-to-b from-white to-moonBottom text-brandBlue"
} as const;

/** The lift (highlight, lip, glow). `sm` buttons never get it, so rows of them stay quiet. */
const LIFT = {
  brand: "shadow-lit active:shadow-litPressed",
  danger: "shadow-litDanger active:shadow-litDangerPressed",
  moon: "shadow-moon active:shadow-moonPressed"
} as const;

const TINT = {
  brand: "bg-brandBlue/[0.08] text-brandBlue hover:bg-brandBlue/[0.11] active:bg-brandBlue/[0.14]",
  danger: "bg-error/[0.08] text-error hover:bg-error/[0.11] active:bg-error/[0.14]",
  glass: "bg-white/10 text-onDarkLabel shadow-glassEdge hover:bg-white/[0.13] active:bg-white/[0.16]"
} as const;

const TINT_MOTION = "active:translate-y-px motion-reduce:active:translate-y-0";

const GHOST = {
  brand: "bg-transparent text-brandBlue hover:bg-brandBlue/[0.06]",
  danger: "bg-transparent text-error hover:bg-error/[0.06]",
  dark: "bg-transparent text-onDarkLabel hover:bg-white/10"
} as const;

const DISABLED = {
  light: "cursor-not-allowed bg-disabledFill text-disabledLabel shadow-none",
  dark: "cursor-not-allowed bg-white/[0.08] text-onDarkLabel/45 shadow-none",
  ghost: "cursor-not-allowed bg-transparent text-disabledLabel"
} as const;

/** Orbit dot, nudged forward on press; the right padding makes room for it. */
const ORBIT =
  "pr-[30px] after:absolute after:right-[14px] after:top-1/2 after:-mt-1 after:h-2 after:w-2 after:rounded-full " +
  "after:bg-orbitCore after:shadow-orbit after:transition-transform active:after:translate-x-[3px] " +
  "motion-reduce:active:after:translate-x-0";

/**
 * Resolves the Tailwind class string for one button. Mirrors mobile's
 * `resolveButtonVisual` (velocity-eSim/src/theme/controls.ts):
 *
 *  - `lit`   — the one main action on a page. `tone="danger"` is for the final
 *              destructive confirm only; on a dark surface it turns into the white "moon".
 *  - `tint`  — everything secondary: a soft wash of the tone, no outline (glass on dark).
 *  - `ghost` — text-only actions ("Skip", "Not now", "Cancel").
 *
 * Disabled drops every raised effect (and the orbit) so it never looks pressable.
 */
export function resolveButtonClasses({
  variant = "lit",
  tone = "brand",
  size = "md",
  surface = "light",
  hero = false,
  disabled = false
}: ResolveButtonClassesArgs = {}): string {
  const dark = surface === "dark";
  const danger = tone === "danger";
  let paint: string;

  if (disabled) {
    paint = variant === "ghost" ? DISABLED.ghost : dark ? DISABLED.dark : DISABLED.light;
  } else if (variant === "lit") {
    // Danger keeps its red even on a dark surface: a delete must never read as the moon.
    const key = danger ? "danger" : dark ? "moon" : "brand";
    paint = [LIT[key], size === "sm" ? "" : LIFT[key], LIT_MOTION].filter(Boolean).join(" ");
  } else if (variant === "tint") {
    paint = `${danger ? TINT.danger : dark ? TINT.glass : TINT.brand} ${TINT_MOTION}`;
  } else {
    paint = danger ? GHOST.danger : dark ? GHOST.dark : GHOST.brand;
  }

  const orbit = hero && variant === "lit" && size !== "sm" && !disabled;

  return [BASE, SIZE_CLASSES[size], paint, orbit ? ORBIT : "", disabled ? "pointer-events-none" : ""]
    .filter(Boolean)
    .join(" ");
}
