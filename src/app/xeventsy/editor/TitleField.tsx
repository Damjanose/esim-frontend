"use client";

const TITLE_MAX_LENGTH = 120;

type Props = {
  value: string;
  onChange: (title: string) => void;
};

/** The event modal's own name. It is only shown in the dashboard list, never inside the app modal. */
export function TitleField({ value, onChange }: Props) {
  return (
    <div className="mb-6 max-w-xl">
      <div className="flex items-baseline justify-between">
        <label htmlFor="event-modal-title" className="block text-sm font-bold text-midnight">
          Name
        </label>
        <span className="text-xs text-muted">
          {value.length} / {TITLE_MAX_LENGTH}
        </span>
      </div>
      <input
        id="event-modal-title"
        type="text"
        maxLength={TITLE_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. World Cup final giveaway"
        className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
      />
      <p className="mt-1 text-xs text-muted">Internal name for the list. Users never see it. Required to save.</p>
    </div>
  );
}
