"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  defaultConsent,
  readConsentFromDocument,
  writeConsentToDocument,
  type ConsentState
} from "@/lib/consent";

type ConsentContextValue = {
  consent: ConsentState | null;
  chooseConsent: (choice: Omit<ConsentState, "version">) => void;
  openPreferences: () => void;
  setSuggestionModalOpen: (open: boolean) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error("useConsent must be used inside ConsentProvider");
  return context;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsentFromDocument());
  }, []);

  const chooseConsent = useCallback((choice: Omit<ConsentState, "version">) => {
    const next = { ...defaultConsent, ...choice };
    writeConsentToDocument(next);
    setConsent(next);
    setPreferencesOpen(false);
  }, []);

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);

  return (
    <ConsentContext.Provider value={{ consent, chooseConsent, openPreferences, setSuggestionModalOpen }}>
      {children}
      {(consent === null && !suggestionModalOpen) || preferencesOpen ? (
        <ConsentDialog hasExistingChoice={consent !== null} />
      ) : null}
    </ConsentContext.Provider>
  );
}

function ConsentDialog({ hasExistingChoice }: { hasExistingChoice: boolean }) {
  const { consent, chooseConsent } = useConsent();
  const [showDetails, setShowDetails] = useState(hasExistingChoice);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setShowDetails(hasExistingChoice);
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
  }, [consent, hasExistingChoice]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !hasExistingChoice) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusableSelector = 'button:not([disabled]), a[href]';
    const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && hasExistingChoice) {
        chooseConsent({ analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false });
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousActiveElement?.focus();
    };
  }, [chooseConsent, consent, hasExistingChoice, showDetails]);

  const save = () => chooseConsent({ analytics, marketing });
  const firstVisit = !hasExistingChoice;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000]">
      <section
        aria-describedby="cookie-consent-description"
        aria-labelledby="cookie-consent-title"
        aria-modal={hasExistingChoice ? true : undefined}
        className={`max-h-[92dvh] w-full overflow-y-auto border-t-2 shadow-[0_-12px_40px_rgba(6,17,49,0.22)] backdrop-blur ${
          firstVisit ? "border-brandBlue bg-brandInk text-white" : "border-outline bg-white/95"
        }`}
        ref={dialogRef}
        role={hasExistingChoice ? "dialog" : "region"}
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-6">
            <div className="min-w-0 flex-1 md:flex md:items-center md:gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <span className={`grid h-6 w-6 place-items-center rounded-md ${firstVisit ? "bg-brandBlue/20 text-brandBlue" : "bg-brandBlue/10 text-brandBlue"}`} aria-hidden="true">
                  <ShieldCheck size={13} />
                </span>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-brandBlue">
                  {firstVisit ? "Privacy" : "Privacy choices"}
                </p>
                {hasExistingChoice ? (
                  <button
                    aria-label="Close privacy choices"
                    className="ml-auto rounded-full p-1 text-onSurfaceVariant transition hover:bg-surfaceVariant md:hidden"
                    onClick={() => chooseConsent({ analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false })}
                    type="button"
                  >
                    <span aria-hidden="true" className="text-lg leading-none">×</span>
                  </button>
                ) : null}
              </div>
              <h2 className={`mt-1 font-display text-base font-black tracking-[-0.02em] md:mt-0 ${firstVisit ? "text-white" : "text-onSurface"}`} id="cookie-consent-title">
                {firstVisit ? "We value your privacy" : "Your privacy choices"}
              </h2>
              <p className={`mt-0.5 max-w-2xl text-[11px] leading-4 md:mt-0 ${firstVisit ? "text-white/70" : "text-onSurfaceVariant"}`} id="cookie-consent-description">
                We use optional cookies for analytics and advertising. Accept or reject them, or customize your choices.{" "}
                <Link className={`font-bold underline decoration-brandBlue/40 underline-offset-2 hover:text-brandBlue ${firstVisit ? "text-white" : "text-onSurface"}`} href="/policy">
                  Learn more
                </Link>
              </p>
            </div>

            {!showDetails ? (
              <div className="grid shrink-0 gap-1.5 sm:grid-cols-3 md:w-[28rem]">
                <button className={`rounded-lg px-2.5 py-2 text-[11px] font-black shadow-[0_5px_14px_rgba(0,0,0,0.16)] transition ${firstVisit ? "bg-white text-brandInk hover:bg-brandBlue hover:text-white" : "bg-brandBlue text-white hover:bg-brandInk"}`} onClick={() => chooseConsent({ analytics: true, marketing: true })} type="button">
                  Accept all
                </button>
                <button className={`rounded-lg border px-2.5 py-2 text-[11px] font-black transition ${firstVisit ? "border-white/40 bg-white text-brandInk hover:bg-brandBlue hover:text-white" : "border-outline bg-white text-onSurface hover:border-brandBlue hover:text-brandBlue"}`} onClick={() => chooseConsent({ analytics: false, marketing: false })} type="button">
                  Reject optional
                </button>
                <button className={`rounded-lg border px-2.5 py-2 text-[11px] font-black transition ${firstVisit ? "border-white/35 bg-white/10 text-white hover:bg-white/20" : "border-outline bg-white text-onSurface hover:border-brandBlue hover:text-brandBlue"}`} onClick={() => setShowDetails(true)} type="button">
                  Manage preferences
                </button>
              </div>
            ) : (
              <div className="w-full shrink-0 md:max-w-3xl">
                <div className="divide-y divide-outline rounded-2xl border border-outline bg-white">
                  <ConsentOption
                    description="Remembers your privacy choice and supports secure site functionality."
                    label="Necessary"
                    locked
                    value
                  />
                  <ConsentOption
                    description="Google Analytics 4 helps us understand which pages and features are useful."
                    label="Analytics"
                    onChange={setAnalytics}
                    value={analytics}
                  />
                  <ConsentOption
                    description="Google Ads and Meta help us measure campaigns and show more relevant promotions."
                    label="Marketing"
                    onChange={setMarketing}
                    value={marketing}
                  />
                </div>
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button className="rounded-xl border border-outline bg-white px-4 py-2.5 text-xs font-black text-onSurface transition hover:border-brandBlue hover:text-brandBlue" onClick={() => chooseConsent({ analytics: false, marketing: false })} type="button">
                    Reject optional
                  </button>
                  <button className="rounded-xl bg-brandBlue px-4 py-2.5 text-xs font-black text-white shadow-[0_5px_14px_rgba(11,73,183,0.2)] transition hover:bg-brandInk" onClick={save} type="button">
                    Save preferences
                  </button>
                </div>
              </div>
            )}

            {hasExistingChoice ? (
              <button
                aria-label="Close privacy choices"
                className="hidden rounded-full p-2 text-onSurfaceVariant transition hover:bg-surfaceVariant md:block"
                onClick={() => chooseConsent({ analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false })}
                type="button"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            ) : null}
          </div>
          {hasExistingChoice ? (
            <p className="mt-2 text-[10px] leading-4 text-onSurfaceVariant/70">
              You can change these choices at any time from the footer.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ConsentOption({
  description,
  label,
  locked = false,
  onChange,
  value
}: {
  description: string;
  label: string;
  locked?: boolean;
  onChange?: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 p-4">
      <div>
        <p className="text-sm font-black text-onSurface">{label}</p>
        <p className="mt-1 text-xs leading-5 text-onSurfaceVariant">{description}</p>
      </div>
      <button
        aria-checked={value}
        aria-label={`${label} cookies`}
        className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition ${value ? "bg-brandBlue" : "bg-outline"} ${locked ? "cursor-not-allowed opacity-70" : ""}`}
        disabled={locked}
        onClick={() => onChange?.(!value)}
        role="switch"
        type="button"
      >
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export function PrivacyChoicesLink() {
  const { openPreferences } = useConsent();
  return (
    <button className="text-left transition hover:text-brandBlue" onClick={openPreferences} type="button">
      Privacy choices
    </button>
  );
}
