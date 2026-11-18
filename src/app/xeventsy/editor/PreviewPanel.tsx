"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "../api";
import { LOCALES, PHASE_LABELS, PHASES, type Phase } from "../eventModal";
import { PhonePreview } from "./PhonePreview";
import type { PreviewPayload } from "./preview";

type PreviewPanelProps = {
  modalId: string | null;
  token: string;
  onUnauthorized: () => void;
  version: number;
  hasUnsavedChanges: boolean;
};

type PreviewResponse = { payload: PreviewPayload | null };

export function PreviewPanel({ modalId, token, onUnauthorized, version, hasUnsavedChanges }: PreviewPanelProps) {
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

  const load = useCallback(async () => {
    if (!modalId) return;
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    const result = await adminFetch<PreviewResponse>(`/${encodeURIComponent(modalId)}/preview`, {
      token,
      method: "POST",
      body: { phase, locale },
      onUnauthorized: () => unauthorizedRef.current()
    });
    if (current !== requestId.current) return;
    setLoading(false);
    if (result.ok) {
      setPayload(result.data.payload ?? null);
    } else {
      setPayload(null);
      setError(result.message);
    }
  }, [modalId, token, phase, locale]);

  useEffect(() => {
    if (!modalId) {
      setPayload(null);
      return;
    }
    void load();
  }, [modalId, version, load]);

  return (
    <aside className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">Preview</p>
          <h2 className="text-sm font-black text-midnight">Phone view</h2>
        </div>
        <button
          aria-label="Refresh preview"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-midnight transition hover:border-cyan disabled:opacity-50"
          disabled={!modalId || loading}
          onClick={() => void load()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={15} />
        </button>
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
          Locale
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

      {!modalId ? (
        <p className="text-xs font-semibold text-muted">Save the modal once to see a preview.</p>
      ) : null}
      {modalId && hasUnsavedChanges ? (
        <p className="text-xs font-semibold text-muted">Preview shows the last saved version.</p>
      ) : null}
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}

      {modalId && !error && !loading && payload === null ? (
        <p className="text-xs font-semibold text-muted">No blocks are visible in this phase.</p>
      ) : null}
      {modalId && payload ? <PhonePreview payload={payload} /> : null}
      {modalId && loading && !payload ? <p className="text-xs font-semibold text-muted">Loading preview...</p> : null}
    </aside>
  );
}
