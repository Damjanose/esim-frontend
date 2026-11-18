"use client";

import { useMemo, useState } from "react";
import {
  BLOCK_DEFS,
  LOCALES,
  applyTextField,
  collectTextFields,
  setTranslation,
  type EditorDraft
} from "../eventModal";
import { localeProgress, translationFor } from "./translations";

type TranslationsTabProps = {
  draft: EditorDraft;
  onChange: (patch: Partial<EditorDraft>) => void;
};

export default function TranslationsTab({ draft, onChange }: TranslationsTabProps) {
  const [locale, setLocale] = useState(LOCALES[1]?.code ?? "ar");
  const editable = locale !== "en";
  const fields = useMemo(() => collectTextFields(draft.blocks), [draft.blocks]);
  const progress = useMemo(() => localeProgress(draft.blocks), [draft.blocks]);

  function updateField(field: (typeof fields)[number], text: string) {
    const next = setTranslation(field.value, locale, text);
    onChange({ blocks: applyTextField(draft.blocks, field.blockId, field.path, next) });
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-sm font-black uppercase tracking-wide text-midnight">Translations</h2>
      <p className="mt-1 text-xs font-semibold text-muted">
        Anything not translated falls back to English.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Locale">
        {LOCALES.map((item) => {
          const selected = item.code === locale;
          const counts = progress[item.code] ?? { translated: 0, total: 0 };
          return (
            <button
              key={item.code}
              type="button"
              aria-pressed={selected}
              onClick={() => setLocale(item.code)}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
                selected ? "border-cyan bg-cyan/10 text-midnight" : "border-line bg-white text-muted hover:border-cyan"
              }`}
            >
              {item.label}
              <span className="rounded-md bg-cloud px-1.5 py-0.5 text-[10px] font-black text-midnight">
                {item.code === "en" ? "source" : `${counts.translated} / ${counts.total}`}
              </span>
            </button>
          );
        })}
      </div>

      {!editable ? (
        <p className="mt-5 text-sm font-semibold text-muted">
          English is the source text. Edit it in the Blocks tab.
        </p>
      ) : fields.length === 0 ? (
        <p className="mt-5 text-sm font-semibold text-muted">Add blocks with text to translate them.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {fields.map((field) => {
            const inputId = `translation-${field.blockId}-${field.path}`.replace(/[^a-zA-Z0-9-_]/g, "-");
            return (
              <li key={`${field.blockId}-${field.path}`} className="rounded-xl border border-line bg-cloud p-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
                  {BLOCK_DEFS[field.blockType].label} · {field.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-midnight">English: {field.value.default || "(empty)"}</p>
                <label className="mt-2 block text-xs font-bold text-midnight" htmlFor={inputId}>
                  {LOCALES.find((item) => item.code === locale)?.label} translation
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={translationFor(field.value, locale)}
                  onChange={(event) => updateField(field, event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan/20"
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
