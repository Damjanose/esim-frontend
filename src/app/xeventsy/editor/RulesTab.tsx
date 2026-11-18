"use client";

import { hasVoteBlock, type EditorDraft } from "../eventModal";

type Props = {
  draft: EditorDraft;
  onChange: (patch: Partial<EditorDraft>) => void;
};

const RULES_MAX_LENGTH = 10000;

export function RulesTab({ draft, onChange }: Props) {
  const giveaway = hasVoteBlock(draft.blocks);

  return (
    <div className="space-y-8">
      {giveaway ? null : (
        <p className="rounded-xl border border-line bg-cloud px-4 py-3 text-sm text-muted">
          Add a vote block in Content to make this a giveaway. Rules are only shown for giveaways.
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="rules-text" className="block text-sm font-bold text-midnight">
            Giveaway rules
          </label>
          <span className="text-xs text-muted">
            {draft.rulesText.length} / {RULES_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="rules-text"
          rows={10}
          maxLength={RULES_MAX_LENGTH}
          value={draft.rulesText}
          onChange={(event) => onChange({ rulesText: event.target.value })}
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
        />
        <p className="text-xs text-muted">
          Required before publishing a giveaway. The app adds the line &quot;Apple is not a sponsor of
          or involved in this giveaway&quot; under your rules.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-midnight">Winner visibility</h3>
        <fieldset className="space-y-2">
          <legend className="sr-only">Winner visibility</legend>
          {(
            [
              { value: "public", label: "Public (masked names)" },
              { value: "winner_only", label: "Only the winner" }
            ] as const
          ).map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-midnight">
              <input
                type="radio"
                name="winnerVisibility"
                value={option.value}
                checked={draft.winnerVisibility === option.value}
                onChange={() => onChange({ winnerVisibility: option.value })}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      </section>
    </div>
  );
}
