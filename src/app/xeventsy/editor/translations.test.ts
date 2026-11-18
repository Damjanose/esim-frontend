import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, newBlock, setTextDefault, setTranslation, type Block } from "../eventModal";
import { localeProgress, translationFor, translationProgress } from "./translations";

function blocksWithText(): Block[] {
  const heading = newBlock("heading", []);
  const text = newBlock("text", ["heading-1"]);
  return [
    { ...heading, props: { ...heading.props, text: setTextDefault(undefined, "Hello") } },
    { ...text, props: { ...text.props, text: setTranslation(undefined, "fr", "Bonjour") } }
  ];
}

describe("translationProgress", () => {
  it("counts translated text fields against the total for one locale", () => {
    const blocks = blocksWithText();
    const fr = translationProgress(blocks, "fr");
    expect(fr.total).toBeGreaterThan(0);
    expect(fr.translated).toBe(1);
  });

  it("treats a blank translation as not translated", () => {
    const heading = newBlock("heading", []);
    const blocks: Block[] = [
      {
        ...heading,
        props: { ...heading.props, text: { default: "Hi", translations: { de: "   " } } }
      }
    ];
    expect(translationProgress(blocks, "de").translated).toBe(0);
  });

  it("returns zero translated when no blocks have text", () => {
    expect(translationProgress([], "ar")).toEqual({ translated: 0, total: 0 });
  });
});

describe("localeProgress", () => {
  it("returns a progress entry for every supported locale", () => {
    const progress = localeProgress(blocksWithText());
    expect(Object.keys(progress).sort()).toEqual(LOCALES.map((l) => l.code).sort());
    expect(progress.fr.translated).toBe(1);
    expect(progress.ar.translated).toBe(0);
  });
});

describe("translationFor", () => {
  it("returns the translation for a locale or an empty string", () => {
    const value = { default: "Hello", translations: { fr: "Bonjour" } };
    expect(translationFor(value, "fr")).toBe("Bonjour");
    expect(translationFor(value, "de")).toBe("");
    expect(translationFor("plain", "fr")).toBe("");
  });
});

describe("TranslationsTab source", () => {
  const source = readFileSync(join(__dirname, "TranslationsTab.tsx"), "utf8");

  it("offers the supported locales from the shared list", () => {
    expect(source).toContain("LOCALES");
  });

  it("supports exactly the 10 locale codes", () => {
    expect(LOCALES.map((locale) => locale.code)).toEqual([
      "en", "ar", "fr", "es", "de", "pt", "tr", "sq", "it", "el"
    ]);
    for (const code of ["ar", "fr", "es", "de", "pt", "tr", "sq", "it", "el"]) {
      expect(translationProgress([], code)).toEqual({ translated: 0, total: 0 });
    }
  });

  it("keeps English read-only and points to the Blocks tab", () => {
    expect(source).toContain("English is the source text. Edit it in the Blocks tab.");
  });

  it("uses the shared helpers to read and write translations", () => {
    expect(source).toContain("collectTextFields");
    expect(source).toContain("applyTextField");
    expect(source).toContain("setTranslation");
  });

  it("states the English fallback", () => {
    expect(source).toContain("Anything not translated falls back to English.");
  });
});
