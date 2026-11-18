import { LOCALES, collectTextFields, type Block, type TextValue } from "../eventModal";

export type TranslationProgress = { translated: number; total: number };

// Translation for one locale, or "" when none is set.
export function translationFor(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const text = (value as TextValue).translations?.[locale];
  return typeof text === "string" ? text : "";
}

// How many text fields in the blocks have a non-blank translation for the locale.
export function translationProgress(blocks: Block[], locale: string): TranslationProgress {
  const fields = collectTextFields(blocks);
  const translated = fields.filter((field) => translationFor(field.value, locale).trim() !== "").length;
  return { translated, total: fields.length };
}

export function localeProgress(blocks: Block[]): Record<string, TranslationProgress> {
  return Object.fromEntries(LOCALES.map((locale) => [locale.code, translationProgress(blocks, locale.code)]));
}
