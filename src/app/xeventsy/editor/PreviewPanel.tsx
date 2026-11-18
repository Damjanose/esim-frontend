"use client";

import { useEffect, useRef, useState } from "react";
import { adminFetch } from "../api";
import { LOCALES, PHASE_LABELS, PHASES, type EditorDraft, type Phase } from "../eventModal";
import { PhonePreview } from "./PhonePreview";
import { buildDraftPreviewBody, type PreviewPayload } from "./preview";

type PreviewPanelProps = {
  draft: EditorDraft;
  token: string;
  onUnauthorized: () => void;
};

type PreviewResponse = { payload: PreviewPayload | null };

export const PREVIEW_DEBOUNCE_MS = 500;

/**
 * Live phone preview of the unsaved draft. Re-renders ~500ms after the last edit. The server builds the payload
 * (same code the app uses) and AI-translates it when a non-English language is picked.
 */
export function PreviewPanel({ draft, token, onUnauthorized }: PreviewPanelProps) {
  const [phase, setPhase] = useState<Phase>("live");
  const [locale, setLocale] = useState("en");
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const unauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    unauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const bodyKey = JSON.stringify(buildDraftPreviewBody(draft, phase, locale));

  useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const result = await adminFetch<PreviewResponse>("/preview-draft", {
        token,
        method: "POST",
        body: JSON.parse(bodyKey),
        onUnauthorized: () => unauthorizedRef.current()
      });
      if (current !== requestId.current) return;
      setLoading(false);
      if (result.ok) {
        setPayload(result.data.payload ?? null);
        setError("");
      } else {
        // Keep the last good preview while the draft is incomplete (for example an empty heading).
        setError(result.message);
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [bodyKey, token]);

  return (
    <aside className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">Live preview</p>
        <h2 className="text-sm font-black text-midnight">Phone view {loading ? "· updating..." : ""}</h2>
        <p className="mt-1 text-[11px] font-semibold text-muted">
          Write in English only. Other languages are translated by AI for each user.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-bold text-muted">
          Phase
          <select
            className="mt-1 h-9 w-full rounded-lg border border-line bg-white px-2 text-xs font-semibold text-midnight"
            onChange={(event) => setPhase(event.target.value as Phase)}
            value={phase}
          >
            {PHASES.map((value) => (
              <option key={value} value={value}>
                {PHASE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-muted">
          Language
          <select
            className="mt-1 h-9 w-full rounded-lg border border-line bg-white px-2 text-xs font-semibold text-midnight"
            onChange={(event) => setLocale(event.target.value)}
            value={locale}
          >
            {LOCALES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="text-xs font-bold text-amber-700">Preview paused: {error}</p> : null}
      {!error && !loading && payload === null ? (
        <p className="text-xs font-semibold text-muted">No blocks are visible in this phase.</p>
      ) : null}
      {payload ? <PhonePreview payload={payload} /> : null}
    </aside>
  );
}
