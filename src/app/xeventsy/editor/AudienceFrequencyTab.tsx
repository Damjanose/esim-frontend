"use client";

import type { EditorDraft, Frequency } from "../eventModal";

type Props = {
  draft: EditorDraft;
  onChange: (patch: Partial<EditorDraft>) => void;
};

type FrequencyMode = Frequency["mode"];

export const FREQUENCY_MODES: Array<{ value: FrequencyMode; label: string; description: string }> = [
  {
    value: "once",
    label: "Once",
    description: "Shows one time per user, then never again."
  },
  {
    value: "daily",
    label: "Once a day",
    description: "Shows at most once per calendar day."
  },
  {
    value: "every_n_opens",
    label: "Every N opens",
    description: "Shows again every N times the app is opened."
  },
  {
    value: "every_n_hours",
    label: "Every N hours",
    description: "Shows again every N hours."
  },
  {
    value: "until_dismissed",
    label: "Until dismissed",
    description: "Keeps showing until the user closes it."
  },
  {
    value: "until_voted",
    label: "Until voted",
    description: "Keeps showing until the user has voted in a giveaway."
  }
];

const NEEDS_N: FrequencyMode[] = ["every_n_opens", "every_n_hours"];

const N_UNIT: Partial<Record<FrequencyMode, string>> = {
  every_n_opens: "opens",
  every_n_hours: "hours"
};

const PLATFORMS: Array<{ value: "ios" | "android"; label: string }> = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" }
];

export function AudienceFrequencyTab({ draft, onChange }: Props) {
  const mode = draft.frequency.mode;
  const selectedMode = FREQUENCY_MODES.find((item) => item.value === mode);

  function togglePlatform(platform: "ios" | "android", checked: boolean) {
    const others = draft.audience.platforms.filter((item) => item !== platform);
    const platforms = checked ? [...others, platform] : others;
    onChange({ audience: { ...draft.audience, platforms } });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-midnight">Audience</h3>
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Platforms (none selected = everyone)</legend>
          {PLATFORMS.map((platform) => (
            <label key={platform.value} className="flex items-center gap-2 text-sm text-midnight">
              <input
                type="checkbox"
                checked={draft.audience.platforms.includes(platform.value)}
                onChange={(event) => togglePlatform(platform.value, event.target.checked)}
              />
              {platform.label}
            </label>
          ))}
        </fieldset>
        <div className="space-y-1.5">
          <label htmlFor="locales" className="block text-sm font-bold text-midnight">
            Languages
          </label>
          <input
            id="locales"
            type="text"
            value={draft.audience.locales}
            placeholder="en, ar, fr (empty = all languages)"
            onChange={(event) =>
              onChange({ audience: { ...draft.audience, locales: event.target.value } })
            }
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="priority" className="block text-sm font-bold text-midnight">
            Priority
          </label>
          <input
            id="priority"
            type="number"
            value={draft.priority}
            onChange={(event) => onChange({ priority: Number(event.target.value) || 0 })}
            className="w-32 rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
          />
          <p className="text-xs text-muted">Higher priority wins when two modals are due at once.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-midnight">Frequency</h3>
        <div className="space-y-1.5">
          <label htmlFor="frequency-mode" className="block text-sm font-bold text-midnight">
            How often to show
          </label>
          <select
            id="frequency-mode"
            value={mode}
            onChange={(event) =>
              onChange({
                frequency: { ...draft.frequency, mode: event.target.value as FrequencyMode }
              })
            }
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
          >
            {FREQUENCY_MODES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {selectedMode ? <p className="text-xs text-muted">{selectedMode.description}</p> : null}
        </div>

        {NEEDS_N.includes(mode) ? (
          <div className="space-y-1.5">
            <label htmlFor="frequency-n" className="block text-sm font-bold text-midnight">
              Every how many {N_UNIT[mode]}
            </label>
            <input
              id="frequency-n"
              type="number"
              min={1}
              value={draft.frequency.n}
              onChange={(event) =>
                onChange({ frequency: { ...draft.frequency, n: event.target.value } })
              }
              className="w-32 rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="frequency-max" className="block text-sm font-bold text-midnight">
            Maximum views per user (optional)
          </label>
          <input
            id="frequency-max"
            type="number"
            min={1}
            value={draft.frequency.maxImpressions}
            onChange={(event) =>
              onChange({ frequency: { ...draft.frequency, maxImpressions: event.target.value } })
            }
            className="w-32 rounded-xl border border-line bg-white px-3 py-2 text-sm text-midnight"
          />
        </div>
      </section>
    </div>
  );
}
