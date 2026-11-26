import type { ReactNode } from "react";

export type SectionStatus = "loading" | "error" | "empty" | "ready";

/** Every section renders through this, so loading, error, empty and ready look the same everywhere. */
export function SectionState({
  state,
  onRetry,
  emptyText = "No data for this range",
  children
}: {
  state: SectionStatus;
  onRetry?: () => void;
  emptyText?: string;
  children?: ReactNode;
}) {
  if (state === "loading") {
    return (
      <div role="status" aria-live="polite" className="space-y-2">
        <div className="h-4 w-1/3 animate-pulse rounded bg-cloud" />
        <div className="h-24 animate-pulse rounded-2xl bg-cloud" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-white p-4">
        <p className="text-sm font-bold text-red-700">This section could not load.</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="rounded-full border border-line px-3 py-1 text-sm font-bold text-midnight">
            Try again
          </button>
        ) : null}
      </div>
    );
  }
  if (state === "empty") return <p className="text-sm text-midnight/60">{emptyText}</p>;
  return <>{children}</>;
}
