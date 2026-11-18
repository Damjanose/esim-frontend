"use client";

import { fromLocalInput, type EditorDraft } from "../eventModal";

type Props = {
  draft: EditorDraft;
  onChange: (patch: Partial<EditorDraft>) => void;
};

type DateField = "startsAt" | "displayUntil" | "votingClosesAt";

function utcHint(local: string): string | null {
  const iso = fromLocalInput(local);
  if (!iso) return null;
  const date = new Date(iso);
  return `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

function DateInput({
  id,
  label,
  help,
  value,
  onChange
}: {
  id: DateField;
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hint = utcHint(value);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold text-midnight">
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
      />
      <p className="text-xs text-muted">{hint ? hint : "Not set"}</p>
      <p className="text-xs text-muted">{help}</p>
    </div>
  );
}

export function ScheduleTab({ draft, onChange }: Props) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">
        Times are in your local time zone: {timeZone}
      </p>
      <DateInput
        id="startsAt"
        label="Starts"
        help="The modal can show from this moment."
        value={draft.startsAt}
        onChange={(value) => onChange({ startsAt: value })}
      />
      <DateInput
        id="votingClosesAt"
        label="Voting closes (match kickoff)"
        help="Only used for giveaways. Voting stops at this moment."
        value={draft.votingClosesAt}
        onChange={(value) => onChange({ votingClosesAt: value })}
      />
      <DateInput
        id="displayUntil"
        label="Show until"
        help="The modal keeps showing after voting closes, so people can see the result until this time."
        value={draft.displayUntil}
        onChange={(value) => onChange({ displayUntil: value })}
      />
    </div>
  );
}
