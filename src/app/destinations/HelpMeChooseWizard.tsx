"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../components/Button";

type CountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
};

type DaysAnswer = { kind: "any" } | { kind: "preset"; days: number } | { kind: "custom"; days: number };
type DataAnswer =
  | { kind: "any" }
  | { kind: "range"; fromGb: number; toGb: number | null }
  | { kind: "unlimited" };

export type WizardResult =
  | { kind: "country"; countryCode: string }
  | {
      kind: "filters";
      days: DaysAnswer;
      data: DataAnswer;
    };

type HelpMeChooseWizardProps = {
  countries: readonly CountryOption[];
  onClose: () => void;
  onFinish: (result: WizardResult) => void;
};

const DAY_PRESETS = [7, 15, 30];
const CUSTOM_DAYS_MIN = 1;
const CUSTOM_DAYS_MAX = 90;

const DATA_BUCKETS: Array<{ label: string; answer: DataAnswer }> = [
  { label: "1–3 GB (light)", answer: { kind: "range", fromGb: 1, toGb: 3 } },
  { label: "5–10 GB (regular)", answer: { kind: "range", fromGb: 5, toGb: 10 } },
  { label: "20 GB+ (heavy)", answer: { kind: "range", fromGb: 20, toGb: null } },
  { label: "Unlimited", answer: { kind: "unlimited" } },
];

export function HelpMeChooseWizard({
  countries,
  onClose,
  onFinish,
}: HelpMeChooseWizardProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [days, setDays] = useState<DaysAnswer>({ kind: "any" });
  const [customDays, setCustomDays] = useState(15);
  const [showCustomDays, setShowCustomDays] = useState(false);
  const [data, setData] = useState<DataAnswer>({ kind: "any" });
  const [destinationQuery, setDestinationQuery] = useState("");

  const filteredCountries = destinationQuery.trim()
    ? countries.filter((c) =>
        c.country.toLowerCase().includes(destinationQuery.trim().toLowerCase()),
      )
    : countries.slice(0, 8);

  function goToDataStep(answer: DaysAnswer) {
    setDays(answer);
    setStep(1);
  }

  function goToDestinationStep(answer: DataAnswer) {
    setData(answer);
    setStep(2);
  }

  function finishWithFilters(dataAnswer: DataAnswer = data) {
    onFinish({ kind: "filters", days, data: dataAnswer });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-midnight/60 backdrop-blur-sm sm:items-center">
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-outline bg-surface p-6 shadow-brandCard sm:rounded-[28px]">
        <button
          aria-label="Close"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-onSurfaceVariant hover:bg-outline/10"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>

        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">
          Help me choose · step {step + 1} of 3
        </p>

        {step === 0 ? (
          <div className="mt-4">
            <h2 className="font-display text-2xl font-black text-brandInk">
              How many days is your trip?
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {DAY_PRESETS.map((preset) => (
                <button
                  className="rounded-full border border-outline px-5 py-2.5 text-sm font-black text-brandInk transition hover:border-brandBlue"
                  key={preset}
                  onClick={() => goToDataStep({ kind: "preset", days: preset })}
                  type="button"
                >
                  {preset} days
                </button>
              ))}

              <button
                className="rounded-full border border-outline px-5 py-2.5 text-sm font-black text-brandInk transition hover:border-brandBlue"
                onClick={() => setShowCustomDays(true)}
                type="button"
              >
                Custom
              </button>
            </div>

            {showCustomDays ? (
              <div className="mt-4 flex items-center gap-3">
                <input
                  className="w-24 rounded-xl border border-outline bg-white px-3 py-2 text-sm font-bold text-brandInk"
                  max={CUSTOM_DAYS_MAX}
                  min={CUSTOM_DAYS_MIN}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10);
                    if (Number.isFinite(value)) {
                      setCustomDays(
                        Math.min(CUSTOM_DAYS_MAX, Math.max(CUSTOM_DAYS_MIN, value)),
                      );
                    }
                  }}
                  type="number"
                  value={customDays}
                />
                <span className="text-xs text-onSurfaceVariant">
                  days ({CUSTOM_DAYS_MIN}–{CUSTOM_DAYS_MAX})
                </span>
                <Button onClick={() => goToDataStep({ kind: "custom", days: customDays })} size="sm">
                  Continue
                </Button>
              </div>
            ) : null}

            <button
              className="mt-6 text-xs font-black uppercase tracking-wide text-onSurfaceVariant hover:text-brandInk"
              onClick={() => goToDataStep({ kind: "any" })}
              type="button"
            >
              Any duration →
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-4">
            <h2 className="font-display text-2xl font-black text-brandInk">
              How much data do you need?
            </h2>

            <div className="mt-5 flex flex-col gap-2">
              {DATA_BUCKETS.map((bucket) => (
                <button
                  className="rounded-2xl border border-outline px-5 py-3 text-left text-sm font-black text-brandInk transition hover:border-brandBlue"
                  key={bucket.label}
                  onClick={() => goToDestinationStep(bucket.answer)}
                  type="button"
                >
                  {bucket.label}
                </button>
              ))}
            </div>

            <button
              className="mt-6 text-xs font-black uppercase tracking-wide text-onSurfaceVariant hover:text-brandInk"
              onClick={() => goToDestinationStep({ kind: "any" })}
              type="button"
            >
              Any amount →
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-4">
            <h2 className="font-display text-2xl font-black text-brandInk">
              Where are you traveling to?
            </h2>

            <input
              autoFocus
              className="mt-5 w-full rounded-2xl border border-outline bg-white px-4 py-3 text-sm font-semibold text-onSurface outline-none focus:border-brandBlue"
              onChange={(e) => setDestinationQuery(e.target.value)}
              placeholder="Search country..."
              type="text"
              value={destinationQuery}
            />

            <div className="mt-3 max-h-64 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-bold text-brandInk transition hover:bg-brandBlue/5"
                  key={country.countryCode}
                  onClick={() =>
                    onFinish({ kind: "country", countryCode: country.countryCode })
                  }
                  type="button"
                >
                  {country.flagUri ? (
                    <img
                      alt=""
                      className="h-8 w-8 rounded-full border border-outline object-cover"
                      src={country.flagUri}
                    />
                  ) : null}
                  {country.country}
                </button>
              ))}

              {filteredCountries.length === 0 ? (
                <p className="px-2 py-4 text-sm text-onSurfaceVariant">No destination found.</p>
              ) : null}
            </div>

            <button
              className="mt-4 text-xs font-black uppercase tracking-wide text-onSurfaceVariant hover:text-brandInk"
              onClick={() => finishWithFilters()}
              type="button"
            >
              Skip — show all matching destinations →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
