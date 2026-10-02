/**
 * Shared class strings for the public content pages (spec section 8, option B:
 * same structure, new styling): SeoContentPage (/travel/*, /use-cases/*), the
 * /travel, /use-cases and /compare hubs, /compare/[slug] and LegalDocumentPage.
 * Same card language as /esim/[slug] (phase 4): 20px cards with outline/70
 * hairlines, surfaceBright tints, the app type scale, 44px link targets.
 */

/** Page top under the floating navbar capsule (it ends 68px down, 76px at lg): 24px clear. */
export const CONTENT_TOP = "pt-[92px] lg:pt-[100px]";

/** Side gutters, the same as /esim/[slug]. */
export const CONTENT_GUTTER = "px-5 md:px-8";

/** Small caps eyebrow above a heading. */
export const CONTENT_EYEBROW = "text-label-caps uppercase text-brandBlue";

/** Page H1: 34px on phones, 48px from sm, 56px at lg (as /esim/[slug]). */
export const CONTENT_H1 =
  "font-display text-[34px] font-black leading-[1.08] tracking-[-0.03em] text-brandInk sm:text-5xl lg:text-[56px]";

/** Section H2 (FAQ titles and similar). */
export const CONTENT_SECTION_H2 =
  "font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]";

/** A section card on a white page. */
export const CONTENT_CARD = "rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-7";

/** A whole-card link on a hub page (the card is the target, so it is far above 44px). */
export const CONTENT_CARD_LINK =
  "group flex h-full flex-col rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard transition hover:border-brandBlue/50 sm:p-6";

/** The leading icon tile of a section card. Hidden below sm so text keeps the width at 320px. */
export const CONTENT_ICON_TILE =
  "hidden h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue sm:grid";

/** The tinted side panel (Related pages). */
export const CONTENT_ASIDE = "rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6";

/** One row link inside the side panel: at least 44px tall. */
export const CONTENT_ROW_LINK =
  "flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-outline/70 bg-surface px-4 py-2.5 text-sm font-bold text-brandInk transition hover:border-brandBlue/50";

/** A standalone text link (back link, breadcrumb, "Browse …"): at least 44px tall. */
export const CONTENT_TEXT_LINK =
  "inline-flex min-h-11 items-center gap-2 font-bold text-brandBlue transition hover:text-brandInk";
