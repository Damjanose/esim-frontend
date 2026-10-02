/**
 * Retired dark-theme colour classes (docs/design/mobile-design-system.md: ink, midnight,
 * cyan, aqua, cloud, mist, line, muted, cyanDeep), the old glow/card shadows and raw
 * slate greys. Source-string tests use it to keep converted files off the old palette.
 */
export const RETIRED_COLOR_CLASS =
  /\b(?:bg|text|border|from|via|to|ring|fill|stroke|divide|placeholder)-(?:ink|midnight|cyan|aqua|cloud|mist|line|muted|cyanDeep)\b|\bshadow-(?:glow|card)\b|\b(?:text|bg|border)-slate-\d+/;
