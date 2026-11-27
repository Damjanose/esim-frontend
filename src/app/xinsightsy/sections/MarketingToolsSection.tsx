"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/insights/format";
import {
  entryToFormInput,
  validateAdSpendForm,
  type AdSpendFormField,
  type AdSpendFormInput
} from "@/lib/insights/adSpendForm";
import { validateChartNoteForm } from "@/lib/insights/chartNoteForm";
import { friendlyError } from "@/lib/insights/marketingErrors";
import { CHART_NOTE_KINDS, type AdSpendEntry, type ChartNote } from "@/lib/insights/types";
import { SectionState, type SectionStatus } from "../ui/SectionState";
import type { InsightsSectionProps } from "../ui/filters";
import { marketingRequest } from "../marketingApi";

type SaveHandler = () => void;

const EMPTY_AD: AdSpendFormInput = { source: "", medium: "", campaign: "", from: "", to: "", amount: "", currency: "usd", note: "" };
const EMPTY_NOTE = { date: "", kind: "ad", title: "" };
const INPUT = "w-full rounded-lg border border-midnight/15 bg-white px-3 py-2 text-sm text-midnight";
const BUTTON = "rounded-lg border border-midnight/15 bg-white px-3 py-1.5 text-sm font-bold text-midnight disabled:opacity-50";
const PRIMARY = "rounded-lg bg-brandBlue px-4 py-2 text-sm font-bold text-white disabled:opacity-50";

export function MarketingToolsSection({
  token,
  filters,
  onUnauthorized,
  onSaved
}: InsightsSectionProps & { onSaved: SaveHandler }) {
  const unauthorized = useRef(onUnauthorized);
  unauthorized.current = onUnauthorized;
  const { from, to } = filters;

  return (
    <section aria-labelledby="insights-marketing-tools" className="space-y-8">
      <h2 id="insights-marketing-tools" className="font-display text-xl font-black text-midnight">Marketing tools</h2>
      <p className="text-sm text-midnight/60">Enter ad spend and notes here. Campaign return and the trend use them.</p>
      <AdSpendTools token={token} from={from} to={to} onSaved={onSaved} onUnauthorized={() => unauthorized.current?.()} />
      <ChartNoteTools token={token} from={from} to={to} onSaved={onSaved} onUnauthorized={() => unauthorized.current?.()} />
    </section>
  );
}

type ToolProps = { token: string; from: string; to: string; onSaved: SaveHandler; onUnauthorized: () => void };

/** Asks for confirmation inline, with no browser dialog. */
function DeleteButton({ onConfirm, label, disabled = false }: { onConfirm: () => void; label: string; disabled?: boolean }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={BUTTON} onClick={() => setAsking(true)} aria-label={`Delete ${label}`} disabled={disabled}>
        Delete
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="font-bold text-midnight">Delete?</span>
      <button type="button" className={BUTTON} onClick={onConfirm} disabled={disabled}>Yes</button>
      <button type="button" className={BUTTON} onClick={() => setAsking(false)}>No</button>
    </span>
  );
}

function AdSpendTools({ token, from, to, onSaved, onUnauthorized }: ToolProps) {
  const [status, setStatus] = useState<SectionStatus>("loading");
  const [entries, setEntries] = useState<AdSpendEntry[]>([]);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState<AdSpendFormInput>(EMPTY_AD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<AdSpendFormField, string>>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setStatus("loading");
    const query = new URLSearchParams({ from, to }).toString();
    marketingRequest<{ entries: AdSpendEntry[] }>(token, "GET", "/bff/admin/insights/ad-spend?" + query).then((result) => {
      if (!active) return;
      if (result.ok) {
        setEntries(result.data.entries);
        setStatus(result.data.entries.length === 0 ? "empty" : "ready");
      } else if (result.unauthorized) {
        onUnauthorized();
      } else {
        setLoadError(friendlyError(result.code));
        setStatus("error");
      }
    });
    return () => {
      active = false;
    };
    // onUnauthorized is read through a ref in the parent, so it is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, from, to, attempt]);

  function reset() {
    setForm(EMPTY_AD);
    setEditingId(null);
    setErrors({});
    setFormError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = validateAdSpendForm(form);
    if (!checked.ok) {
      setErrors(checked.errors);
      setFormError("");
      return;
    }
    setErrors({});
    setSaving(true);
    const result = editingId
      ? await marketingRequest(token, "PUT", `/bff/admin/insights/ad-spend/${encodeURIComponent(editingId)}`, checked.value)
      : await marketingRequest(token, "POST", "/bff/admin/insights/ad-spend", checked.value);
    setSaving(false);
    if (result.ok) {
      reset();
      setAttempt((count) => count + 1);
      onSaved();
    } else if (result.unauthorized) {
      onUnauthorized();
    } else {
      setFormError(friendlyError(result.code));
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    const result = await marketingRequest(token, "DELETE", `/bff/admin/insights/ad-spend/${encodeURIComponent(id)}`);
    setDeletingId(null);
    if (result.ok || result.code === "not_found") {
      if (editingId === id) reset();
      setAttempt((count) => count + 1);
      onSaved();
    } else if (result.unauthorized) {
      onUnauthorized();
    } else {
      setLoadError(friendlyError(result.code));
      setStatus("error");
    }
  }

  function startEdit(entry: AdSpendEntry) {
    setEditingId(entry.id);
    setForm(entryToFormInput(entry));
    setErrors({});
    setFormError("");
  }

  const field = (name: keyof AdSpendFormInput, label: string, type = "text", extra: Record<string, unknown> = {}) => (
    <label className="grid gap-1 text-xs font-bold text-midnight/70">
      {label}
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={(event) => setForm({ ...form, [name]: event.target.value })}
        className={INPUT}
        aria-invalid={errors[name as AdSpendFormField] ? true : undefined}
        {...extra}
      />
      {errors[name as AdSpendFormField] ? <span className="text-red-700">{errors[name as AdSpendFormField]}</span> : null}
    </label>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-black text-midnight">Ad spend</h3>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-midnight/10 bg-white p-4 md:grid-cols-4" aria-label="Ad spend form">
        {field("source", "Source", "text", { placeholder: "google" })}
        {field("medium", "Medium", "text", { placeholder: "cpc" })}
        {field("campaign", "Campaign", "text", { placeholder: "fall-sale" })}
        {field("amount", "Amount", "text", { inputMode: "decimal", placeholder: "12.50" })}
        {field("from", "From", "date")}
        {field("to", "To", "date")}
        {field("currency", "Currency", "text", { maxLength: 3 })}
        {field("note", "Note", "text", { maxLength: 200 })}
        <div className="flex flex-wrap items-center gap-2 md:col-span-4">
          <button type="submit" className={PRIMARY} disabled={saving}>{editingId ? "Save changes" : "Add ad spend"}</button>
          {editingId ? <button type="button" className={BUTTON} onClick={reset}>Cancel edit</button> : null}
          {formError ? <span role="alert" className="text-sm font-bold text-red-700">{formError}</span> : null}
        </div>
      </form>
      <SectionState state={status} onRetry={() => setAttempt((count) => count + 1)} emptyText="No ad spend in this range">
        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs font-bold uppercase text-midnight/60">
                <tr>
                  <th className="py-2">Source</th>
                  <th>Medium</th>
                  <th>Campaign</th>
                  <th>Dates</th>
                  <th className="text-right">Amount</th>
                  <th>Note</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-midnight/10 text-midnight">
                    <td className="py-2">{entry.source}</td>
                    <td>{entry.medium ?? "—"}</td>
                    <td>{entry.campaign}</td>
                    <td>{entry.from} to {entry.to}</td>
                    <td className="text-right tabular-nums">{formatMoney({ byCurrency: { [entry.currency]: entry.amountCents }, unknownCount: 0 })}</td>
                    <td>{entry.note ?? "—"}</td>
                    <td className="space-x-2 whitespace-nowrap text-right">
                      <button type="button" className={BUTTON} onClick={() => startEdit(entry)} aria-label={`Edit ${entry.campaign}`}>Edit</button>
                      <DeleteButton label={entry.campaign} disabled={deletingId !== null} onConfirm={() => remove(entry.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionState>
      {status === "error" ? <p className="text-sm text-red-700">{loadError}</p> : null}
    </div>
  );
}

function ChartNoteTools({ token, from, to, onSaved, onUnauthorized }: ToolProps) {
  const [status, setStatus] = useState<SectionStatus>("loading");
  const [notes, setNotes] = useState<ChartNote[]>([]);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(EMPTY_NOTE);
  const [errors, setErrors] = useState<Partial<Record<"date" | "kind" | "title", string>>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setStatus("loading");
    const query = new URLSearchParams({ from, to }).toString();
    marketingRequest<{ notes: ChartNote[] }>(token, "GET", "/bff/admin/insights/chart-notes?" + query).then((result) => {
      if (!active) return;
      if (result.ok) {
        setNotes(result.data.notes);
        setStatus(result.data.notes.length === 0 ? "empty" : "ready");
      } else if (result.unauthorized) {
        onUnauthorized();
      } else {
        setLoadError(friendlyError(result.code));
        setStatus("error");
      }
    });
    return () => {
      active = false;
    };
    // onUnauthorized is read through a ref in the parent, so it is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, from, to, attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = validateChartNoteForm(form);
    if (!checked.ok) {
      setErrors(checked.errors);
      setFormError("");
      return;
    }
    setErrors({});
    setSaving(true);
    const result = await marketingRequest(token, "POST", "/bff/admin/insights/chart-notes", checked.value);
    setSaving(false);
    if (result.ok) {
      setForm(EMPTY_NOTE);
      setAttempt((count) => count + 1);
      onSaved();
    } else if (result.unauthorized) {
      onUnauthorized();
    } else {
      setFormError(friendlyError(result.code));
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    const result = await marketingRequest(token, "DELETE", `/bff/admin/insights/chart-notes/${encodeURIComponent(id)}`);
    setDeletingId(null);
    if (result.ok || result.code === "not_found") {
      setAttempt((count) => count + 1);
      onSaved();
    } else if (result.unauthorized) {
      onUnauthorized();
    } else {
      setLoadError(friendlyError(result.code));
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-black text-midnight">Chart notes</h3>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-midnight/10 bg-white p-4 md:grid-cols-4" aria-label="Chart note form">
        <label className="grid gap-1 text-xs font-bold text-midnight/70">
          Date
          <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className={INPUT} />
          {errors.date ? <span className="text-red-700">{errors.date}</span> : null}
        </label>
        <label className="grid gap-1 text-xs font-bold text-midnight/70">
          Kind
          <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })} className={INPUT}>
            {CHART_NOTE_KINDS.filter((kind) => kind !== "holiday").map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>
          {errors.kind ? <span className="text-red-700">{errors.kind}</span> : null}
        </label>
        <label className="grid gap-1 text-xs font-bold text-midnight/70 md:col-span-2">
          Title
          <input type="text" maxLength={80} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={INPUT} />
          {errors.title ? <span className="text-red-700">{errors.title}</span> : null}
        </label>
        <div className="flex flex-wrap items-center gap-2 md:col-span-4">
          <button type="submit" className={PRIMARY} disabled={saving}>Add note</button>
          {formError ? <span role="alert" className="text-sm font-bold text-red-700">{formError}</span> : null}
        </div>
      </form>
      <SectionState state={status} onRetry={() => setAttempt((count) => count + 1)} emptyText="No notes in this range">
        {notes.length > 0 ? (
          <ul className="divide-y divide-midnight/10 rounded-2xl border border-midnight/10 bg-white">
            {notes.map((note) => (
              <li key={note.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-midnight">
                <span>
                  <span className="tabular-nums">{note.date}</span> · {note.readOnly ? "Holiday (built in)" : note.kind} · {note.title}
                </span>
                {!note.readOnly ? <DeleteButton label={note.title} disabled={deletingId !== null} onConfirm={() => remove(note.id)} /> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </SectionState>
      {status === "error" ? <p className="text-sm text-red-700">{loadError}</p> : null}
    </div>
  );
}
