'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Clock3, Globe2, Search, X } from "lucide-react";
import { normalizeDestinationValue } from "@/services/packages";

export type CountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
};

const RESULTS_LIMIT = 30;
const RECENT_LIMIT = 3;
const RECENT_STORAGE_KEY = "esim2you.recentDestinations";
// Market priority: US, then UK, then the rest of Europe.
// Codes are the catalog's destination slugs, not ISO codes.
const POPULAR_CODES = [
  "united-states",
  "united-kingdom",
  "italy",
  "spain",
  "france",
  "germany",
  "greece",
  "turkey",
];

export function readRecentDestinations(): CountryOption[] {
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? (parsed as CountryOption[])
          .filter((item) => item?.countryCode && item?.country)
          .slice(0, RECENT_LIMIT)
      : [];
  } catch {
    return [];
  }
}

export function rememberRecentDestination(country: CountryOption) {
  try {
    const key = normalizeDestinationValue(country.countryCode);
    const next = [
      country,
      ...readRecentDestinations().filter(
        (item) => normalizeDestinationValue(item.countryCode) !== key,
      ),
    ].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode etc.) — recents are a convenience only.
  }
}

/** Bolds the matched part of the name; skips it if normalizing changed the length. */
function HighlightedName({ name, query }: { name: string; query: string }) {
  const normalizedName = normalizeDestinationValue(name);
  const index = query ? normalizedName.indexOf(query) : -1;

  if (index < 0 || normalizedName.length !== name.length) {
    return <>{name}</>;
  }

  return (
    <>
      {name.slice(0, index)}
      <span className="font-black text-brandBlue">
        {name.slice(index, index + query.length)}
      </span>
      {name.slice(index + query.length)}
    </>
  );
}

type HeroSearchDialogProps = {
  countries: readonly CountryOption[];
  loading: boolean;
  error: string | null;
  navigating: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSelect: (country: CountryOption) => void;
};

/**
 * Destination search dialog: full screen on phones, a centered panel over a
 * dimmed page from sm up. Portaled to <body> so it escapes the hero's
 * `isolate` stacking context and sits above the fixed navbar and bottom dock
 * instead of rendering inline and pushing the hero around.
 */
export function HeroSearchDialog({
  countries,
  loading,
  error,
  navigating,
  inputRef,
  onClose,
  onSelect,
}: HeroSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [recent] = useState(readRecentDestinations);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeDestinationValue(deferredQuery);
  // Keyboard-highlighted match; resets to the top whenever the query changes.
  const [active, setActive] = useState({ query: "", index: 0 });
  const activeIndex = active.query === normalizedQuery ? active.index : 0;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    // Desktop scrollbars vanish under overflow:hidden; pad so the page behind
    // the backdrop doesn't jump sideways.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  useEffect(() => {
    resultsRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, normalizedQuery]);

  const popular = useMemo(() => {
    const byCode = new Map(
      countries.map((country) => [
        normalizeDestinationValue(country.countryCode),
        country,
      ]),
    );

    return POPULAR_CODES.flatMap((code) => byCode.get(code) ?? []);
  }, [countries]);

  const matches = useMemo(() => {
    if (!normalizedQuery) return [];

    return countries
      .filter(
        (country) =>
          normalizeDestinationValue(country.country).includes(normalizedQuery) ||
          normalizeDestinationValue(country.countryCode) === normalizedQuery,
      )
      .sort(
        (first, second) =>
          Number(!normalizeDestinationValue(first.country).startsWith(normalizedQuery)) -
          Number(!normalizeDestinationValue(second.country).startsWith(normalizedQuery)),
      )
      .slice(0, RESULTS_LIMIT);
  }, [countries, normalizedQuery]);

  function select(country: CountryOption) {
    if (navigating) return;
    setPendingCode(country.countryCode);
    onSelect(country);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (matches.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive({
        query: normalizedQuery,
        index: (activeIndex + step + matches.length) % matches.length,
      });
    } else if (event.key === "Enter" && matches.length > 0) {
      event.preventDefault();
      select(matches[activeIndex] ?? matches[0]);
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    // Keep Tab inside the dialog; the page behind it is inert to the user.
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>("input, button:not([disabled])") ?? [],
    ).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function renderRow(country: CountryOption, highlight: boolean, index = -1) {
    const isPending = pendingCode === country.countryCode;
    const isActive = highlight && index === activeIndex;

    return (
      <li key={country.countryCode}>
        <button
          className={[
            "flex min-h-[60px] w-full items-center gap-3 border-b border-outline/40 px-1 py-2 text-left transition-colors active:bg-brandBlue/5 disabled:opacity-60 sm:rounded-[12px] sm:px-2",
            // Matches share one highlight (keyboard or mouse); other lists use hover.
            highlight ? "" : "sm:hover:bg-brandBlue/5",
            isActive ? "bg-brandBlue/5" : "",
          ].join(" ")}
          data-active={isActive ? "true" : undefined}
          disabled={navigating}
          onMouseMove={
            highlight && !isActive
              ? () => setActive({ query: normalizedQuery, index })
              : undefined
          }
          onClick={() => select(country)}
          type="button"
        >
          {country.flagUri ? (
            <img
              alt=""
              className="h-9 w-9 shrink-0 rounded-full border border-outline/60 object-cover"
              src={country.flagUri}
            />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
              <Globe2 aria-hidden="true" size={18} />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-bold text-onSurface">
              {highlight ? (
                <HighlightedName name={country.country} query={normalizedQuery} />
              ) : (
                country.country
              )}
            </span>
            <span className="mt-0.5 block text-[13px] font-medium text-onSurfaceVariant">
              {country.planCount} {country.planCount === 1 ? "plan" : "plans"}
            </span>
          </span>

          {isPending ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brandBlue/30 border-t-brandBlue" />
          ) : (
            <ChevronRight aria-hidden="true" className="shrink-0 text-onSurfaceVariant/70" size={18} />
          )}
        </button>
      </li>
    );
  }

  const sectionLabel =
    "mb-1 block text-[12px] font-bold uppercase tracking-[0.14em] text-onSurfaceVariant";

  let body;
  if (loading) {
    body = (
      <div className="flex items-center gap-3 py-6">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brandBlue/30 border-t-brandBlue" />
        <p className="text-sm font-semibold text-onSurfaceVariant">Loading destinations...</p>
      </div>
    );
  } else if (error) {
    body = (
      <div className="py-6">
        <p className="text-sm font-semibold text-onSurface">Could not load destinations</p>
        <p className="mt-1 text-xs leading-5 text-onSurfaceVariant">{error}</p>
      </div>
    );
  } else if (normalizedQuery) {
    body =
      matches.length > 0 ? (
        <section>
          <h2 className={sectionLabel}>Matching destinations</h2>
          <ul>{matches.map((country, index) => renderRow(country, true, index))}</ul>
        </section>
      ) : (
        <div className="py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-brandBlue/30 bg-brandBlue/10 text-brandBlue">
            <Globe2 aria-hidden="true" size={22} />
          </span>
          <p className="mt-4 text-sm font-black text-onSurface">No destination found</p>
          <p className="mt-1 text-xs font-semibold text-onSurfaceVariant">
            Try searching for another country.
          </p>
        </div>
      );
  } else {
    body = (
      <div className="flex flex-col gap-6">
        {recent.length > 0 ? (
          <section>
            <h2 className={sectionLabel}>Recent</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {recent.map((country) => (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-outline bg-surface px-3.5 text-sm font-semibold text-onSurface disabled:opacity-60"
                  disabled={navigating}
                  key={country.countryCode}
                  onClick={() => select(country)}
                  type="button"
                >
                  <Clock3 aria-hidden="true" className="text-onSurfaceVariant" size={15} />
                  {country.country}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {popular.length > 0 ? (
          <section>
            <h2 className={sectionLabel}>Popular</h2>
            <ul className="sm:grid sm:grid-cols-2 sm:gap-x-4">
              {popular.map((country) => renderRow(country, false))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className={sectionLabel}>All destinations · A–Z</h2>
          <ul className="sm:grid sm:grid-cols-2 sm:gap-x-4">
            {countries.map((country) => renderRow(country, false))}
          </ul>
        </section>
      </div>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex flex-col bg-surface text-onSurface sm:items-center sm:bg-brandInk/60 sm:px-6 sm:pb-6 sm:pt-[10vh] sm:backdrop-blur-sm"
      onMouseDown={(event) => {
        // Backdrop click (sm+ only; on phones the panel covers the screen).
        if (event.target !== event.currentTarget) return;
        // Stop the mousedown from moving focus to <body> after onClose
        // has returned it to the hero trigger.
        event.preventDefault();
        onClose();
      }}
    >
      <div
        aria-label="Search destinations"
        aria-modal="true"
        className="flex min-h-0 flex-1 flex-col bg-surface sm:max-h-[min(680px,80vh)] sm:w-full sm:max-w-[680px] sm:flex-none sm:overflow-hidden sm:rounded-[24px] sm:shadow-[0_32px_80px_rgba(6,17,49,0.45)]"
        onKeyDown={handleDialogKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-center gap-2.5 border-b border-outline/40 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:p-4">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[14px] border-2 border-brandBlue bg-outline/10 pl-3.5 pr-1">
            <Search aria-hidden="true" className="shrink-0 text-brandBlue" size={20} />
            <span className="sr-only">Search destination</span>
            <input
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-onSurface outline-none placeholder:text-onSurfaceVariant/60"
              enterKeyHint="search"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Country or region"
              inputMode="search"
              ref={inputRef}
              type="text"
              value={query}
            />
            {query ? (
              <button
                aria-label="Clear search"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-onSurfaceVariant"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            ) : null}
          </label>

          <button
            className="h-11 shrink-0 px-1 text-base font-bold text-brandBlue sm:hidden"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5"
          ref={resultsRef}
        >
          {body}
        </div>

        <div className="hidden items-center gap-4 border-t border-outline/40 px-5 py-2.5 text-xs font-semibold text-onSurfaceVariant sm:flex">
          <span>↑ ↓ to move</span>
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
